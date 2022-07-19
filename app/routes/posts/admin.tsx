import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
    Link,
    Outlet,
    useLoaderData,
} from "@remix-run/react";

import { getSession, commitSession } from "~/session.server";
import { getPosts } from "~/models/post.server";

type LoaderData = {
    posts: Awaited<ReturnType<typeof getPosts>>;
    message: string
};

export const loader: LoaderFunction = async ({ request }) => {
    console.warn("In admin loader")
    const session = await getSession(request);

    console.warn("Session", session);
    const message = session.get("globalMessage") || null;
    console.warn("Message", message);

    return json({ posts: await getPosts(), message: message }, {
        headers: {
            // only necessary with cookieSessionStorage
            "Set-Cookie": await commitSession(session),
        },
    });
};

export default function PostAdmin() {
    const { posts, message } = useLoaderData() as unknown as LoaderData;
    return (
        <div className="mx-auto max-w-4xl">
            <h1 className="my-6 mb-2 border-b-2 text-center text-3xl">
                Blog Admin
            </h1>
            <div className="grid grid-cols-4 gap-6">
                <nav className="col-span-4 md:col-span-1">
                    <ul>
                        {posts.map((post) => (
                            <li key={post.slug}>
                                <Link
                                    to={post.slug}
                                    className="text-blue-600 underline"
                                >
                                    {post.title}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
                <main className="col-span-4 md:col-span-3">
                    <span>{message}</span>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}