import React, { useEffect, useState } from "react";

/**
 * Dev-mode only print preview page.
 * Reads the HTML content to print from localStorage and triggers window.print().
 */
export default function PrintLayout() {
    const [html, setHtml] = useState<string | null>(null);

    useEffect(() => {
        const content = localStorage.getItem("nexora.temp.print.html");
        if (content) {
            setHtml(content);
            // Wait for images to render/load if any, then print
            // 500ms is usually enough for data-uri images
            const timer = setTimeout(() => {
                window.print();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, []);

    if (!html) {
        return <div className="p-10 text-center">No print content found.</div>;
    }

    return (
        <>
            <style>{`
        @page { margin: 0; size: auto; }
        body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; }
        /* Hide scrollbars during print/preview */
        ::-webkit-scrollbar { display: none; }
      `}</style>
            <div
                className="h-screen w-screen bg-white"
                dangerouslySetInnerHTML={{ __html: html }}
            />
        </>
    );
}
