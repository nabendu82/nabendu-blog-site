import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { Metadata } from "next";
import { Github, Twitter, Linkedin, Mail, Briefcase, Award, Code2, Cpu, CheckCircle2, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
    title: "About Me | Nabendu",
    description: "Learn more about Nabendu, a Senior Software Engineer specializing in the JavaScript, React, and Next.js ecosystems.",
};

export default async function AboutPage() {
    const skills = {
        frontend: [
            "React",
            "Next.js",
            "JavaScript (ES6+)",
            "TypeScript",
            "React Native",
            "Tailwind CSS",
            "Angular",
            "HTML5 & CSS3",
            "Framer Motion"
        ],
        backend: [
            "Node.js",
            "Express",
            "MongoDB (MERN Stack)",
            "RESTful APIs",
            "GraphQL"
        ],
        tools: [
            "Git & GitHub",
            "Webpack",
            "Vite",
            "Chrome DevTools",
            "Performance Optimization",
            "Agile / Scrum"
        ]
    };

    return (
        <div className="container max-w-6xl py-10 lg:py-16 space-y-12">
            {/* Header section with decorative spotlight gradient */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-neutral-900 to-neutral-800 dark:from-neutral-950 dark:to-neutral-900 p-8 md:p-12 text-white shadow-xl">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                <div className="relative z-10 space-y-4 max-w-3xl">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary-foreground backdrop-blur-md">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span>Professional Portfolio</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight">
                        About Me
                    </h1>
                    <p className="text-neutral-300 text-lg md:text-xl font-normal leading-relaxed">
                        Senior Software Engineer & Full-Stack Developer with over 22 years of technical expertise.
                    </p>
                </div>
            </div>

            {/* Grid layout for sidebar and main bio */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">

                {/* Sidebar - Profile Card */}
                <Card className="md:col-span-1 shadow-md border-neutral-200/60 dark:border-neutral-800/60 overflow-hidden">
                    <CardHeader className="flex flex-col items-center text-center space-y-4 pb-6 bg-muted/30">
                        <div className="relative group">
                            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-primary to-accent opacity-75 blur transition duration-300 group-hover:opacity-100" />
                            <Avatar className="h-36 w-36 relative border-4 border-background">
                                <AvatarImage src="/avatar.jpg" alt={siteConfig.author} className="object-cover" />
                                <AvatarFallback className="text-xl font-bold">NB</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold tracking-tight">
                                {siteConfig.author}
                            </h2>
                            <p className="text-primary text-sm font-semibold tracking-wide uppercase">
                                Senior Software Engineer
                            </p>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span>Remote / Bangalore, India</span>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-6">
                        <div className="flex flex-col gap-2">
                            <Link
                                href={siteConfig.links.github}
                                target="_blank"
                                className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start gap-3")}
                            >
                                <Github className="h-4 w-4" />
                                <span>GitHub Profile</span>
                            </Link>
                            <Link
                                href={siteConfig.links.twitter}
                                target="_blank"
                                className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start gap-3")}
                            >
                                <Twitter className="h-4 w-4 text-sky-500" />
                                <span>Twitter / X</span>
                            </Link>
                            <Link
                                href="https://www.linkedin.com/in/nabendu-biswas/"
                                target="_blank"
                                className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start gap-3")}
                            >
                                <Linkedin className="h-4 w-4 text-blue-600" />
                                <span>LinkedIn Profile</span>
                            </Link>
                            <a
                                href="mailto:nabendu.biswas@gmail.com"
                                className={cn(buttonVariants({ variant: "default" }), "w-full justify-start gap-3 mt-2")}
                            >
                                <Mail className="h-4 w-4" />
                                <span>Contact Me</span>
                            </a>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content - Bio and Skills */}
                <div className="md:col-span-2 space-y-8">

                    {/* Bio Section */}
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold tracking-tight border-b pb-2">Professional Summary</h3>
                        <div className="text-muted-foreground text-base leading-relaxed space-y-4">
                            <p>
                                I am a seasoned Senior Software Engineer with over <strong>22 years of IT industry experience</strong>, specializing in the modern <strong>JavaScript and React ecosystems</strong> for the past <strong>10+ years</strong>. My technical foundation spans building responsive, scalable, and highly performant web and mobile interfaces.
                            </p>
                            <p>
                                My expertise includes full-stack development with the <strong>MERN Stack (MongoDB, Express, React, Node.js)</strong> and <strong>Next.js</strong>, as well as building cross-platform mobile apps using <strong>React Native</strong>. I have also worked with Angular, GraphQL, TypeScript, and various advanced tooling pipelines.
                            </p>
                            <p>
                                Currently, I work remotely as a Senior Software Engineer for a Bangalore-based technology company, designing robust architecture solutions and collaborating across distributed teams to deliver high-quality, product-ready software.
                            </p>
                        </div>
                    </div>

                    {/* Stats Highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="bg-muted/20 border-neutral-200/50 dark:border-neutral-800/50">
                            <CardHeader className="p-4 space-y-1">
                                <CardDescription className="text-xs uppercase tracking-wider font-semibold">Experience</CardDescription>
                                <CardTitle className="text-2xl font-black text-primary">22+ Years</CardTitle>
                                <span className="text-xs text-muted-foreground">In IT Industry</span>
                            </CardHeader>
                        </Card>
                        <Card className="bg-muted/20 border-neutral-200/50 dark:border-neutral-800/50">
                            <CardHeader className="p-4 space-y-1">
                                <CardDescription className="text-xs uppercase tracking-wider font-semibold">Specialization</CardDescription>
                                <CardTitle className="text-2xl font-black text-primary">10+ Years</CardTitle>
                                <span className="text-xs text-muted-foreground">React & Modern JS</span>
                            </CardHeader>
                        </Card>
                        <Card className="bg-muted/20 border-neutral-200/50 dark:border-neutral-800/50">
                            <CardHeader className="p-4 space-y-1">
                                <CardDescription className="text-xs uppercase tracking-wider font-semibold">Engagement</CardDescription>
                                <CardTitle className="text-2xl font-black text-primary">Full-Stack</CardTitle>
                                <span className="text-xs text-muted-foreground">Web & Mobile Solutions</span>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* Skills & Technologies */}
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold tracking-tight border-b pb-2">Technical Expertise</h3>

                        <div className="space-y-4">
                            {/* Frontend */}
                            <div className="space-y-2">
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <Code2 className="h-4 w-4 text-primary" />
                                    <span>Frontend & Mobile Development</span>
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {skills.frontend.map((skill) => (
                                        <span key={skill} className="inline-flex items-center rounded-md border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-100 dark:bg-neutral-900 px-2.5 py-1 text-xs font-medium text-foreground transition-colors">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Backend */}
                            <div className="space-y-2">
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <Cpu className="h-4 w-4 text-primary" />
                                    <span>Backend & API Architecture</span>
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {skills.backend.map((skill) => (
                                        <span key={skill} className="inline-flex items-center rounded-md border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-100 dark:bg-neutral-900 px-2.5 py-1 text-xs font-medium text-foreground transition-colors">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Tools */}
                            <div className="space-y-2">
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <Briefcase className="h-4 w-4 text-primary" />
                                    <span>Engineering Tools & Workflow</span>
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {skills.tools.map((skill) => (
                                        <span key={skill} className="inline-flex items-center rounded-md border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-100 dark:bg-neutral-900 px-2.5 py-1 text-xs font-medium text-foreground transition-colors">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Engineering Values Statement */}
                    <Card className="bg-muted/10 border-dashed border-neutral-200/80 dark:border-neutral-800/80">
                        <CardHeader className="p-6">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Award className="h-5 w-5 text-primary" />
                                <span>Engineering Philosophy</span>
                            </CardTitle>
                            <CardDescription className="text-sm italic leading-relaxed pt-2">
                                &ldquo;I believe in writing clean, readable code and building architectures that stand the test of time. While technology cycles change rapidly, core software engineering fundamentals—scalability, accessibility, clean separation of concerns, and delivering optimized user experiences—are the true markers of a successful engineer.&rdquo;
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        </div>
    );
}