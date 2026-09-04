"use client";

const socials = [
  {
    name: "YouTube",
    href: "https://www.youtube.com/@greenscreensolutions7140",
    icon: "https://cdn.simpleicons.org/youtube/ffffff",
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/techcraft__solution/",
    icon: "https://cdn.simpleicons.org/instagram/ffffff",
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@techcraft12?_r=1&_t=ZS-99SdlZV9a40",
    icon: "https://cdn.simpleicons.org/tiktok/ffffff",
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/share/1Bx1ALu884/",
    icon: "https://cdn.simpleicons.org/facebook/ffffff",
  },
];

export default function SocialLinks() {
  return (
    <nav className="convertx-social-links" aria-label="ConvertX social media">
      {socials.map((social) => (
        <a
          key={social.name}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit ConvertX on ${social.name}`}
          title={social.name}
          className="convertx-social-link"
        >
          <img src={social.icon} alt="" aria-hidden="true" width="18" height="18" />
        </a>
      ))}
    </nav>
  );
}
