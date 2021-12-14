import React from "react";
import { Box, Image } from "theme-ui";

type GivetyLogoProps = React.ComponentProps<typeof Box> & {
  height?: number | string;
};

export const GivetyLogo: React.FC<GivetyLogoProps> = ({ height, ...boxProps }) => (
  <Box sx={{ lineHeight: 0 }} {...boxProps}>
    <Image src="./gusd-icon.png" sx={{ height }} />
  </Box>
);
