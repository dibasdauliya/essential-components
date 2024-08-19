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
      type="gradient"
      gradient-color="red;orange;violet"
      >
      This is heading 2
    </essential-heading>
  )
}

export function EssentialHeaderBgImg() {
    return (
        <essential-heading class="heading-1" bg-img="/img/mountain.jpg" style={{fontSize:'2em', fontWeight: 900, lineHeight: 1.2}}>
         With background image clipped!
        </essential-heading>
    )
}
