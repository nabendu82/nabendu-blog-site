"use client";
import { posts } from "#site/content";
import { PostItem } from "@/components/post-item";
import { QueryPagination } from "@/components/query-pagination";
import { sortPosts } from "@/lib/utils";
import { useRouter } from "next/navigation";

const POSTS_PER_PAGE = 20;

interface BlogPageProps {
    searchParams: {
        page?: string;
        search?: string;
    };
}

export default function BlogPage({ searchParams }: BlogPageProps) {
    const router = useRouter();
    const currentPage = Number(searchParams?.page) || 1;
    const searchQuery = searchParams?.search?.toLowerCase() || "";

    const sortedPosts = sortPosts(posts.filter((post) => post.published));

    // Filter posts based on search query
    const filteredPosts = sortedPosts.filter((post) =>
        post.title.toLowerCase().includes(searchQuery)
    );

    const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
    const totalPosts = filteredPosts.length;

    // Paginate the filtered posts
    const displayPosts = filteredPosts.slice(
        POSTS_PER_PAGE * (currentPage - 1),
        POSTS_PER_PAGE * currentPage
    );

    // Handle search input change
    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newSearch = event.target.value;
        router.push(`?search=${newSearch}&page=1`);
    };

    return (
        <div className="container max-w-4xl py-6 lg:py-10">
            <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:gap-8">
                <div className="flex-1 space-y-4">
                    <h1 className="inline-block font-black text-4xl lg:text-5xl">
                        Blogs <span className="text-muted-foreground text-3xl ml-2">({totalPosts})</span>
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        My ramblings on all things web dev.
                    </p>
                    {/* Search Input */}
                    <input
                        type="text"
                        placeholder="Search blogs by title..."
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                        defaultValue={searchQuery}
                        onChange={handleSearchChange}
                    />
                </div>
            </div>
            <hr className="mt-8" />
            {displayPosts.length > 0 ? (
                <ul className="flex flex-col">
                    {displayPosts.map((post) => {
                        const { slug, date, title, description } = post;
                        return (
                            <li key={slug}>
                                <PostItem
                                    slug={slug}
                                    date={date}
                                    title={title}
                                    description={description}
                                />
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p>No blogs found</p>
            )}
            <QueryPagination totalPages={totalPages} className="justify-end mt-4" />
        </div>
    );
}
