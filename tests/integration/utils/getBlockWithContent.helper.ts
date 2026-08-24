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
 * - templateWrapper (gets the block's children)
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
  let blocks = render.getBlocksByVariant(variant);

  // Gnarly workaround for `templateWrapper` blocks, which contain arrays of `RenderBlocks` in their slots. We only care
  // about the slotted blocks for testing, so we flatten them out into a single array of `RenderBlock`s.
  if (variant === "templateWrapper") {
    blocks = blocks.reduce(
      (acc: RenderBlock[], block: RenderBlock): RenderBlock[] => {
        const slots = Object.values(
          block.properties.slots as Record<string, RenderBlock[]>,
        );
        const blocks = slots.reduce((acc, slot) => [...acc, ...slot]);
        return [...acc, ...blocks];
      },
      [],
    );
  }

  // Find the `RenderBlock` with the requested content. Different variants have different paths to their content, which
  // we account for in the switch. Errors about undefined properties _may_ mean you have a block that we haven't handled yet.
  return blocks.find((block) => {
    let blockContent;

    switch (block.variant) {
      case "html":
        blockContent = block.properties.content as string;
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
