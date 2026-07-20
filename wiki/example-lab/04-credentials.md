# Credentials

This lab defines three **credential variables** in its frontmatter. Each
participant gets their **own** values, filled in by the admin when the lab is
assigned. Open the **Credentials** tab (top of the lab view) to see and copy them:

- **API endpoint** (`endpoint`) — rendered as a clickable link with a copy button
- **Kubeconfig** (`yaml`) — rendered as a highlighted, copyable YAML block
- **Cluster join token** (`text`) — rendered as monospace text with a copy button

Unfilled variables are hidden, so a participant only ever sees the values that
have been set for them.

## Using a credential

Copy your **Cluster join token** from the Credentials tab, then register your node:

```bash
nkp join --token <PASTE_YOUR_TOKEN_HERE>
```

Credential values live on your assignment — revoking the assignment clears them.
