import { useEffect } from "react";

interface SEOProps {
    title: string;
    description: string;
    keywords?: string;
    canonical?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    ogType?: string;
    twitterCard?: string;
}

export function useSEO({
    title,
    description,
    keywords,
    canonical,
    ogTitle,
    ogDescription,
    ogImage = "https://cameraman-pro-2aa2b.web.app/logo.png",
    ogType = "website",
    twitterCard = "summary_large_image"
}: SEOProps) {
    useEffect(() => {
        // Update page title
        document.title = title;

        // Helper to update or create meta tags
        const setMetaTag = (name: string, content: string, isProperty = false) => {
            const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
            let element = document.querySelector(selector);
            if (!element) {
                element = document.createElement("meta");
                if (isProperty) {
                    element.setAttribute("property", name);
                } else {
                    element.setAttribute("name", name);
                }
                document.head.appendChild(element);
            }
            element.setAttribute("content", content);
        };

        // Helper to update or create canonical link
        const setCanonicalLink = (href: string) => {
            let element = document.querySelector('link[rel="canonical"]');
            if (!element) {
                element = document.createElement("link");
                element.setAttribute("rel", "canonical");
                document.head.appendChild(element);
            }
            element.setAttribute("href", href);
        };

        // Update description, keywords
        setMetaTag("description", description);
        if (keywords) {
            setMetaTag("keywords", keywords);
        }
        
        const currentUrl = window.location.href;
        setCanonicalLink(canonical || currentUrl);

        // Update Open Graph (OG) tags
        setMetaTag("og:title", ogTitle || title, true);
        setMetaTag("og:description", ogDescription || description, true);
        setMetaTag("og:url", canonical || currentUrl, true);
        setMetaTag("og:image", ogImage, true);
        setMetaTag("og:type", ogType, true);

        // Update Twitter Cards
        setMetaTag("twitter:title", ogTitle || title);
        setMetaTag("twitter:description", ogDescription || description);
        setMetaTag("twitter:image", ogImage);
        setMetaTag("twitter:card", twitterCard);
    }, [title, description, keywords, canonical, ogTitle, ogDescription, ogImage, ogType, twitterCard]);
}
