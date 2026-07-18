import {
  type ContentFormat,
  type RemotionProps,
  RemotionPropsSchema,
} from "../lib/video/remotion-props";

export function parseCompositionProps(
  input: RemotionProps,
  expectedFormat: ContentFormat,
): RemotionProps {
  const props = RemotionPropsSchema.parse(input);

  if (props.format !== expectedFormat) {
    throw new Error(
      `Expected Remotion props for ${expectedFormat}, received ${props.format}.`,
    );
  }

  return props;
}
