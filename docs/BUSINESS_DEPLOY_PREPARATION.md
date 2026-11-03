# ZaMaGui Business — isolated deployment preparation

Status: preparation only; NOTHING deployed to HOSTiQ.

Download the prepared ZIP from the accompanying ChatGPT conversation and copy its four files into this branch preserving paths:

- `.github/workflows/business-deploy.yml`
- `scripts/check-business.sh`
- `business-site/index.html`
- `SETUP.md`

Before merging verify the FTP account is scoped exclusively to the business.zamagui.com Document Root, that explicit FTPS with validated TLS certificate works, and that the proposed destination inbox receives messages.

Deployment is manually initiated with approval and scoped environment secrets. Do not change any existing zamagui.com release workflows.
