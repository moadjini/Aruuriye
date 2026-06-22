import Image from "next/image";

export default function Favicon() {
  return (
    <>
      <link rel="icon" href="/logo.png" sizes="32x32" />
      <link rel="icon" href="/logo.png" sizes="16x16" />
      <link rel="apple-touch-icon" href="/logo.png" />
    </>
  );
}
