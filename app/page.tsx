import WorkspaceClient from "./workspace-client";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}/#webapp`,
      name: "ConvertX",
      url: siteUrl,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Any",
      isAccessibleForFree: true,
      description:
        "Free online image and PDF converter for PNG, JPG, WEBP and PDF files. Files are processed directly in the browser.",
      featureList: [
        "PNG to JPG",
        "JPG to PNG",
        "WEBP to JPG",
        "JPG to WEBP",
        "Image compression",
        "Image resizing",
        "Images to PDF",
        "PDF to JPG and PNG",
        "Merge PDF",
        "Split PDF",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "ConvertX",
      url: siteUrl,
      description: "Free online image and PDF conversion tools.",
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <WorkspaceClient />
      <section className="sr-only" aria-label="About ConvertX">
        <h1>Free Online Image and PDF Converter</h1>
        <p>
          ConvertX is a free online file converter for PNG, JPG, JPEG, WEBP and PDF files.
          Convert images and PDFs directly in your browser without creating an account.
        </p>
        <h2>Image converters</h2>
        <p>
          Convert PNG to JPG, JPG to PNG, WEBP to JPG and JPG to WEBP. Compress images or
          resize them to exact dimensions.
        </p>
        <h2>PDF tools</h2>
        <p>
          Convert images to PDF, render PDF pages as JPG or PNG, merge PDF documents and
          split a PDF page into a new document.
        </p>
        <h2>Private browser processing</h2>
        <p>
          Files are processed locally in the browser for the supported conversion tools,
          so the basic image conversions do not require an account or database.
        </p>
      </section>
    </>
  );
}
