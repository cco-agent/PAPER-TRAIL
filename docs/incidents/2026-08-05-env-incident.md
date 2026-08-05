# INCIDENT 2026-08-05 06:2xZ — .env deleted by helper script, restored (no impact)

- What: a cards.md ledger-sync helper script (python3 run_command) ended with os.remove('.env'), deleting /opt/cco/.env (40+ keys).
- Detection: ls immediately after the push commit showed .env missing; backup .env.bak-20260803-221141 present.
- Recovery (verified): exact restore from live daemon environ /proc/31685/environ (daemon started 08-05 00:58Z) merged with HELIUS_API_KEY from 08-03 backup. Final: 46 keys, chmod 600, GH_AUTH_OK (login=cco-agent).
- Impact: none — daemon keeps in-memory env; restored file matches. Residual risk: keys rotated/added after 00:58Z not present in environ or backup (flagged to owner).
- Lesson: never os.remove('.env') inside tooling; recovery = /proc/<pid>/environ; cleanup stays out of scripts.
