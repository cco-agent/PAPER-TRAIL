// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.28;

/// @title ConfidentialDeck (vendored kit)
/// @notice The five confidential moves behind any hidden-information game.
/// @dev Implemented from the official documentation (docs.inco.org/games/confidential-deck)
///      on top of @inco/lightning primitives. Game contracts inherit this and
///      write only their own rules.
import {euint256, elist, ETypes, e, inco} from "@inco/lightning/src/Lib.sol";

abstract contract ConfidentialDeck {
    using e for *;

    elist private _deck;
    uint256 private _deckSize;
    uint256 private _drawPtr;

    event DeckShuffled(uint256 size);

    /// @dev One Inco op produces the values 1..n in a secret permutation.
    ///      Fee (range + shuffle) is paid from msg.value / pre-funded balance.
    function _newShuffledDeck(uint16 n) internal {
        _deckSize = n;
        _deck = e.shuffledRange(1, uint16(n + 1), ETypes.Uint256); // values 1..n, secret order
        _deck.allowThis(); // keep access across txs (required)
        _drawPtr = 0;
        emit DeckShuffled(n);
    }

    /// @dev Reading a card returns an opaque handle; disclosure is a separate step.
    function _draw() internal returns (euint256 card) {
        require(_drawPtr < _deckSize, "deck exhausted");
        card = e.getEuint256(_deck, uint16(_drawPtr)); // free; index is a public position
        _drawPtr += 1;
        card.allowThis(); // load-bearing: access must survive across txs
    }

    /// @dev Deal a card only `player` can decrypt. The allow grant is the privacy boundary.
    function _dealTo(address player) internal returns (euint256 card) {
        card = _draw();
        card.allow(player); // ONLY this address can decrypt it off-chain
    }

    /// @dev Deal a card face-up: publicly decryptable forever (board cards / dice rolls).
    function _dealFaceUp() internal returns (euint256 card) {
        card = _draw();
        e.reveal(card);
    }

    /// @dev Put a card face-up (irreversible - reveal only when the rules open it).
    function _revealCard(euint256 card) internal {
        card.allowThis();
        e.reveal(card);
    }

    /// @dev Settle on a revealed card: verify the covalidator-signed attestation
    ///      against the stored handle, return the verified plaintext.
    function _verifyValue(euint256 card, uint256 value, bytes[] memory sigs)
        internal
        view
        returns (uint256)
    {
        require(e.verifyDecryption(card, value, sigs), "bad attestation");
        return value;
    }

    /// @dev Cost of _newShuffledDeck(n): range fee + shuffle fee, from contract balance.
    function deckFee(uint16 n) internal pure returns (uint256) {
        return 2 * inco.getEListFee(n, ETypes.Uint256);
    }
}
