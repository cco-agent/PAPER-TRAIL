// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.28;

/// @title PaperTrailLanes
/// @notice PAPER TRAIL x Inco Lightning: 3-lane hidden-card tug-of-war.
/// @dev Demo scope (Summer Game Jam): one human (playerA) vs simulated opponent
///      (playerB). Hidden hands are dealt via the ConfidentialDeck kit; lane
///      resolution settles on covalidator-signed attestations (Model A) so the
///      winner is provably fair. The gauge is a public tug-of-war counter;
///      feeding the shredder is a burn event (full game burns $PAPERTRAIL).
import {euint256, elist, ETypes, e, inco} from "@inco/lightning/src/Lib.sol";
import "./ConfidentialDeck.sol";

contract PaperTrailLanes is ConfidentialDeck {
    using e for *;

    uint256 public constant DECK_SIZE = 24; // PAPER TRAIL 24-card subset
    uint256 public constant LANES = 3; // The Headline / The Media / The Underground
    uint256 public constant ROUND_SECONDS = 180; // 3-minute tug-of-war
    int256 public constant GAUGE_PUSH = 10; // lane win moves the needle

    address public immutable playerA; // human challenger
    address public immutable playerB; // simulated opponent (demo)
    address public immutable dealer; // deployer / seed authority

    euint256[LANES] private _handA;
    euint256[LANES] private _handB;
    bool private _dealt;
    bool private _resolved;
    mapping(uint8 => bool) private _laneSettled;

    uint256 public roundStart;
    uint256 public settledLanes;
    uint256 public scoreA;
    uint256 public scoreB;
    int256 public gauge; // >0 leans playerA, <0 leans playerB
    uint256 public totalFed; // shredder burn tally (demo)
    address public winner; // resolved winner; address(0) = draw

    event RoundDealt(address a, address b, uint256 roundStart);
    event LaneSettled(uint8 lane, uint256 valueA, uint256 valueB, bool winnerA, bool tie);
    event RoundResolved(address winner, uint256 scoreA, uint256 scoreB, int256 gauge); // winner == address(0) = draw
    event ShredderFed(address indexed burner, uint256 amount);

    constructor(address _a, address _b) payable {
        require(msg.value >= 2 * deckFee(uint16(DECK_SIZE)), "fund deck fees");
        dealer = msg.sender;
        playerA = _a;
        playerB = _b;
        _newShuffledDeck(uint16(DECK_SIZE));
        for (uint256 i = 0; i < LANES; i++) {
            _handA[i] = _dealTo(playerA);
        }
        _newShuffledDeck(uint16(DECK_SIZE));
        for (uint256 i = 0; i < LANES; i++) {
            _handB[i] = _dealTo(playerB);
        }
        _dealt = true;
        roundStart = block.timestamp;
        emit RoundDealt(playerA, playerB, roundStart);
    }

    /// @notice Opaque card handles for the frontend to decrypt (owner only) or reveal.
    function handOf(address who, uint8 lane) external view returns (euint256) {
        require(who == playerA || who == playerB, "unknown player");
        require(lane < LANES, "bad lane");
        return who == playerA ? _handA[lane] : _handB[lane];
    }

    /// @notice Settle a lane: frontend brings both attested plaintexts; contract
    ///         verifies them against the stored handles, then resolves.
    /// @dev The winning card is revealed face-up for the crowd. No if/require on
    ///      encrypted values - attestation verification is on plaintext.
    function settleLane(
        uint8 lane,
        uint256 valueA,
        uint256 valueB,
        bytes[] calldata sigsA,
        bytes[] calldata sigsB
    ) external {
        require(_dealt && !_resolved, "round over");
        require(lane < LANES, "bad lane");
        require(!_laneSettled[lane], "lane settled");
        require(block.timestamp <= roundStart + ROUND_SECONDS, "tug-of-war ended");

        uint256 vA = _verifyValue(_handA[lane], valueA, sigsA);
        uint256 vB = _verifyValue(_handB[lane], valueB, sigsB);

        _laneSettled[lane] = true;
        settledLanes += 1;

        bool winnerA;
        bool tie;
        if (vA > vB) {
            winnerA = true;
            scoreA += 1;
            gauge += GAUGE_PUSH;
            _revealCard(_handA[lane]);
        } else if (vB > vA) {
            scoreB += 1;
            gauge -= GAUGE_PUSH;
            _revealCard(_handB[lane]);
        } else {
            tie = true; // push: no score, needle holds
        }
        emit LaneSettled(lane, vA, vB, winnerA, tie);

        if (settledLanes == LANES) {
            _resolve();
        }
    }

    /// @notice Time-expiry resolution: anyone may close the round once the 3-minute
    ///         tug-of-war is over; unsettled lanes simply award nothing.
    function resolveAfterTimeout() external {
        require(_dealt && !_resolved, "round over");
        require(block.timestamp > roundStart + ROUND_SECONDS, "still live");
        _resolve();
    }

    /// @notice Feed the shredder: burn-to-feed mechanic (demo: payable burn tally;
    ///         full game burns $PAPERTRAIL ERC20 here).
    function feedShredder() external payable {
        require(msg.value > 0, "zero burn");
        totalFed += msg.value;
        emit ShredderFed(msg.sender, msg.value);
    }

    /// @notice Per-lane settlement flag for frontend polling.
    function laneSettled(uint8 lane) external view returns (bool) {
        require(lane < LANES, "bad lane");
        return _laneSettled[lane];
    }

    /// @notice Dealer-only: reclaim unused deck-fee funding once the round is over.
    ///         Demo hygiene - the constructor over-funds deck fees; this returns
    ///         the margin instead of locking it. (Full game: shredder burns
    ///         $PAPERTRAIL ERC20, not ETH, so this is demo-only bookkeeping.)
    function withdraw() external {
        require(msg.sender == dealer, "dealer only");
        require(_resolved, "round not over");
        uint256 bal = address(this).balance;
        require(bal > 0, "empty");
        (bool ok, ) = dealer.call{value: bal}("");
        require(ok, "withdraw failed");
    }

    function _resolve() internal {
        _resolved = true;
        if (scoreA > scoreB) {
            winner = playerA;
        } else if (scoreB > scoreA) {
            winner = playerB;
        } else {
            // tie-break: the needle decides. address(0) = draw.
            winner = gauge > 0 ? playerA : (gauge < 0 ? playerB : address(0));
        }
        emit RoundResolved(winner, scoreA, scoreB, gauge);
    }

    /// @notice Frontend status bundle.
    function status()
        external
        view
        returns (
            bool dealt,
            bool resolved,
            uint256 lanes,
            uint256 scoreA_,
            uint256 scoreB_,
            int256 gauge_,
            uint256 roundEndsAt
        )
    {
        return (
            _dealt,
            _resolved,
            settledLanes,
            scoreA,
            scoreB,
            gauge,
            roundStart + ROUND_SECONDS
        );
    }
}
