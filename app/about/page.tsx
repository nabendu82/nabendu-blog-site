import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { siteConfig } from "@/config/site";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Me",
    description: "Information about Nabendu",
};

export default async function AboutPage() {
    return (
        <div className="container max-w-6xl py-6 lg:py-10">
            <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:gap-8">
                <div className="flex-1 space-x-4">
                    <h1 className="inline-block font-black text-4xl lg:text-5xl">
                        About Me
                    </h1>
                </div>
            </div>
            <hr className="my-8" />
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                <div className="min-w-48 max-w-48 flex flex-col gap-2">
                    <Avatar className="h-48 w-48">
                        <AvatarImage src="/avatar.jpg" alt={siteConfig.author} />
                        <AvatarFallback>NB</AvatarFallback>
                    </Avatar>
                    <h2 className="text-2xl font-bold text-center break-words">
                        {siteConfig.author}
                    </h2>
                    <p className="text-muted-foreground text-center break-words">
                        Full Stack Developer
                    </p>
                </div>
                <p className="text-muted-foreground text-lg py-4">
                I have 18+ years of IT Experience, with 8+ years into ReactJS Ecosystem. Very strong working knowledge of JavaScript including ES6. Full knowledge of MERN stack and NextJS also. Beside this i know and had worked on Angular, React Native, GraphQL, TypeScript and other web-app technologies. 
                <br />
                <br />
                Currently working as Senior Software Engineer(Remote) for a Bangalore based company.
                </p>
            </div>
        </div>
    );
}