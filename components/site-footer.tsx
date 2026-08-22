import { siteConfig } from "@/config/site";
import { Mail } from "lucide-react";
import { Icons } from "./icons";

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-border/40 py-6 mt-12 sm:mt-16">
      <div className="container flex flex-col items-center justify-center gap-2">
        <div className="flex items-center space-x-4 text-foreground/70">
          <a
            target="_blank"
            rel="noreferrer"
            href="mailto:nabendu.biswas@gmail.com"
            className="hover:text-foreground transition-colors p-1"
            aria-label="Mail"
          >
            <Mail className="h-5 w-5" />
          </a>
          <a
            target="_blank"
            rel="noreferrer"
            href={siteConfig.links.twitter}
            className="hover:text-foreground transition-colors p-1"
            aria-label="Twitter"
          >
            <Icons.twitter className="h-4 w-4" />
          </a>
          <a
            target="_blank"
            rel="noreferrer"
            href={siteConfig.links.github}
            className="hover:text-foreground transition-colors p-1"
            aria-label="GitHub"
          >
            <Icons.gitHub className="h-4 w-4" />
          </a>
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {siteConfig.author}
        </span>
      </div>
    </footer>
  );
}