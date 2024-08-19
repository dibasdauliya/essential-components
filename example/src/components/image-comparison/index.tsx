import 'essential-components/src/image-comparison';

export default function ImageComparison() {
  return (
    <image-comparison thumb-color="#000">
        <img slot="image1" src="/img/japan-2011-after.jpg" alt="" />
        <img slot="image2" src="/img/japan-2011-before.jpg" alt="" />
    </image-comparison>
  )
}
