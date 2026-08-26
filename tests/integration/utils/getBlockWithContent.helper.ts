import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";
import { TestRenderResult } from "@ministryofjustice/hmpps-forge/core/testing";

/**
 * Gets a block based on the variant and it's content.
 *
 * The return is type-hinted as never being undefined to prevent TS errors, but
 * you should probably assert `expect(block).to.exist` in your tests.
 *
 * Supported block variants:
 * - html
 * - govukBody
 * - govukHeading
 * - govukButton
 * - govukDateInputFull
 *
 * @param render  Forge test harness render result.
 * @param variant  Block variant to search for — this is the `variant` property of the `RenderBlock`, not the component name.
 * @param content
 * @returns RenderBlock | undefined
 */
export function getBlockWithContent(
  render: TestRenderResult,
  variant: string,
  content: string,
) {
  const blocks = render.getBlocksByVariant(variant);

  // Find the `RenderBlock` with the requested content. Different variants have different paths to their content, which
  // we account for in the switch. Errors about undefined properties _may_ mean you have a block that we haven't handled yet.
  return blocks.find((block) => {
    let blockContent;

    switch (block.variant) {
      case "html":
        blockContent = block.properties.content as string;
        break;
      case "govukBody":
        blockContent = block.properties.text as string;
        break;
      case "govukHeading":
        blockContent = block.properties.text as string;
        break;
      case "govukButton":
        blockContent = block.properties.text as string;
        break;
      case "govukDateInputFull":
        blockContent = block.properties.label as string;
        break;
      default:
        throw new Error(`Unsupported variant: ${variant}`);
    }

    return blockContent.includes(content);
  }) as RenderBlock;
}
