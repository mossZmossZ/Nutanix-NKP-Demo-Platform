# Code & YAML

Fenced code blocks are syntax-highlighted and get a **copy** button when you hover
over them.

## Shell commands

Run these from your desktop terminal:

```bash
kubectl get nodes -o wide
kubectl apply -f cluster.yaml
```

## A YAML manifest

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: nkp-demo
  labels:
    workshop: example-lab
```

Hover over either block and click the copy icon in the corner to grab the raw
contents — handy for pasting long commands or manifests into your lab machine.
