# Security

This platform stores machine credentials and runs real infrastructure automation, so it has a
larger attack surface than a typical demo site. Keep these rules.

## Secrets

- **Never commit secrets.** JWT secret, `ADMIN_USER`/`ADMIN_PASSWORD`, Nutanix Terraform creds,
  and Redis/Mongo passwords live in env only. Ship a `.env.example` with empty values;
  `.env` is git-ignored.
- **Rotate the seeded admin password** after first login in any real deployment. The static
  seed exists for bootstrap, not as a permanent credential.
- **Don't log secrets.** Terraform/Ansible output is streamed to job logs and the admin UI —
  scrub or avoid printing passwords/tokens there. Guacamole tokens are short-lived.

## Credentials at rest

- RDP passwords (`Machine.adminPassword`, `Assignment.rdpPassword`) are sensitive. At minimum
  keep them out of API responses to non-admins and out of client logs. Prefer
  **encrypting at rest** (app-level encryption key from env) over plaintext in Mongo.
- The user's Credentials tab returns only **their own** assignment. Enforce ownership in the
  service layer, not just the UI.

## Auth & access control

- JWT in an **httpOnly, Secure, SameSite** cookie — not in `localStorage`.
- **RBAC is enforced server-side** on every `/admin/*` route (`requireAdmin`). UI hiding is
  not security.
- Short access-token lifetime; validate `role` from the token, never from the request body.

## Provisioning safety

- **Terraform/Ansible only run inside the BullMQ worker**, never from an HTTP handler and
  never with input interpolated straight into a shell. Use `execa` with an argument array
  (no `shell: true`), and pass variables via Terraform var-files / Ansible `--extra-vars`
  files — not string concatenation.
- Validate/whitelist which template an admin may run; treat template names as an allowlist,
  not a free path (prevent path traversal into arbitrary dirs).
- Per-machine workdirs isolate concurrent runs; clean them up (and destroy infra) on
  deprovision.

## Transport & network

- **TLS terminated at nginx** in prod; redirect HTTP→HTTPS.
- Guacamole (`/guac`) sits behind the same proxy/auth; don't expose `guacd` publicly.
- Provisioned VMs' RDP ports should be reachable only from the Guacamole gateway, not the
  open internet, where the network allows it.

## Dependencies

- Keep Terraform, the Nutanix provider, Ansible, and Guacamole images pinned to known
  versions; update deliberately.
