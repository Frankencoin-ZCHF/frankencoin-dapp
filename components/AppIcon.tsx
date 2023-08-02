interface Props {
  src: string
  size?: 'small' | 'medium' | 'large'
  full?: boolean
}

export default function AppIcon({
  size,
  src,
  full,
}: Props) {
  if (!size) size = 'medium';
  const classes = `inline-block ${size == 'small' ? 'w-4 h-4' : size == 'medium' ? 'w-6 h-6' : 'w-10 h-10'} ${full && 'w-full'}`;
  return (
    <picture>
      <source srcSet={src} type="image/svg" />
      <img src={src} className={classes} alt="Icon" />
    </picture>
  )
}