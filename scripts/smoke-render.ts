import { compositionIdForFormat } from "../src/lib/video/remotion-props";
import { remotionFixtures } from "../src/remotion/fixtures";
import { renderVideoJob } from "../worker/render";
import { StubR2RenderedVideoUploader } from "../worker/r2-upload";

async function main() {
  const uploader = new StubR2RenderedVideoUploader();
  for (const fixture of remotionFixtures) {
    const result = await renderVideoJob(
      {
        contentItemId: `smoke-${fixture.id}`,
        compositionId: compositionIdForFormat(fixture.format),
        props: fixture.props,
      },
      uploader,
    );
    console.log("RENDERED", fixture.format, result.localPath);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
