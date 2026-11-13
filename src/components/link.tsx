import { forwardRef, type AnchorHTMLAttributes } from 'react';
import { Link as RouterLink } from 'react-router-dom';

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  /** Accepted for compatibility with the old Next.js Link API; ignored. */
  passHref?: boolean;
  prefetch?: boolean;
};

/**
 * In-app links use client-side routing; external URLs, `#hash` anchors,
 * `mailto:` and links opened in a new tab fall back to a plain <a>.
 */
const Link = forwardRef<HTMLAnchorElement, Props>(function Link({ href, passHref: _p, prefetch: _f, ...rest }, ref) {
  const isExternal = /^(https?:|mailto:|tel:)/.test(href) || href.startsWith('#') || rest.target === '_blank';
  if (isExternal) return <a ref={ref} href={href} {...rest} />;
  return <RouterLink ref={ref} to={href} {...rest} />;
});

export default Link;
