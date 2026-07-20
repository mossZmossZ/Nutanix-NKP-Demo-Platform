# Images

Guide pages can embed images. Because a lab can be exported and imported as a
single file, images are referenced by **absolute URL** — host them anywhere your
browser can reach (a public S3 object works well):

![NKP console](https://placehold.co/800x400/702dff/ffffff?text=NKP+Console)

<!--
  Swap the placeholder above for your own hosted image, e.g. a public S3 object:
  ![NKP console](https://my-bucket.s3.ap-southeast-1.amazonaws.com/labs/example/console.png)

  Local dev only: you may instead drop files in wiki/<slug>/images/ and reference
  them relatively, e.g. ![console](images/console.png). Relative paths are NOT
  carried by export/import — use absolute URLs for portable labs.
-->

## You've reached the end

That's every feature: Markdown, highlighted code and YAML, copy buttons, per-user
credentials, and images. Duplicate this file, edit the frontmatter and pages, and
you have a new lab. Mark this page complete to finish.
