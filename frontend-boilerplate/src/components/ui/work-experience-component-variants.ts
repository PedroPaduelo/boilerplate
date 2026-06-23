import { cva } from "class-variance-authority"

export const workExperienceComponentVariants = cva("", {
  variants: {
    variant: {
      timeline: "",
      card: "",
    },
  },
  defaultVariants: {
    variant: "timeline",
  },
})
