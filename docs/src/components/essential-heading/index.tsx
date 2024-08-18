import 'essential-components/src/essential-heading';

import React from 'react'

export function EssentialHeaderBorder() {
  return (
    <essential-heading class="heading-1" show-border="true" border-color="orange" fill-color="#ddd">
        with border
   </essential-heading>
  )
}

export function EssentialHeaderGradient() {
  return (
    <essential-heading
      class="heading-1"
      id="heading-2"
      type="gradient"
      gradient-color="blue;indigo;violet"
      >
      This is heading 2
    </essential-heading>
  )
}

