# Troubleshooting

## Docker not running

If commands fail immediately, confirm Docker is installed and running.
Then retry.

## Ports already in use

Check `infra/ports.yaml` for the allocated port and ensure nothing else
is bound to that port.
Update the registry only via scaffolding commands.

## Tooling command missing

The CLI installs go-task automatically inside the container.
If it fails, rerun `./mono bootstrap` and check `reports/**` for logs.

## Docs build fails

Run `./mono contracts:build` first to regenerate API bundles,
then retry `./mono docs:build`.
