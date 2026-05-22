export default function Link({ children, ...props }: { children: React.ReactNode; href: string }) {
  return <a {...props}>{children}</a>;
}
