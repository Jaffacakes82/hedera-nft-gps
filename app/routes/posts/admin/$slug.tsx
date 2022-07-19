import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { redirect, json } from "@remix-run/node";
import { Form, useActionData, useTransition, useLoaderData } from "@remix-run/react";
import { updatePost, getPost, Post } from "~/models/post.server";
import { getSession, commitSession } from "~/session.server";
import invariant from "tiny-invariant";

type ActionData =
    | {
        summary: null | string;
        title: null | string;
        slug: null | string;
        markdown: null | string;
    }
    | undefined;

type LoaderData = { post: Post; };

export const loader: LoaderFunction = async ({ params }) => {
    invariant(params.slug, `params.slug is required`);

    const post = await getPost(params.slug);
    invariant(post, `Post not found: ${params.slug}`);

    return json<LoaderData>({ post });
};

export const action: ActionFunction = async ({ request }) => {
    // TODO: remove me
    await new Promise((res) => setTimeout(res, 1000));

    const formData = await request.formData();

    const title = formData.get("title");
    const slug = formData.get("slug");
    const markdown = formData.get("markdown");

    const errors: ActionData = {
        summary: null,
        title: title ? null : "Title is required",
        slug: slug ? null : "Slug is required",
        markdown: markdown ? null : "Markdown is required",
    };

    const hasErrors = Object.values(errors).some(
        (errorMessage) => errorMessage
    );

    if (hasErrors) {
        return json<ActionData>(errors);
    }

    invariant(
        typeof title === "string",
        "title must be a string"
    );

    invariant(
        typeof slug === "string",
        "slug must be a string"
    );

    invariant(
        typeof markdown === "string",
        "markdown must be a string"
    );

    try {
        await updatePost({ title, slug, markdown });
    } catch {
        const errors: ActionData = {
            summary: "Failed to update post",
            title: title ? null : "Title is required",
            slug: slug ? null : "Slug is required",
            markdown: markdown ? null : "Markdown is required",
        };

        return json<ActionData>(errors);
    }

    const session = await getSession(request);

    session.flash(
        "globalMessage",
        `Successfully updated post`
    );

    return redirect("/posts/admin", {
        headers: {
            "Set-Cookie": await commitSession(session),
        },
    });
};

const inputClassName = `w-full rounded border border-gray-500 px-2 py-1 text-lg`;

export default function NewPost() {
    const errors = useActionData();
    const { post } = useLoaderData() as unknown as LoaderData;
    const transition = useTransition();
    const isCreating = Boolean(transition.submission);

    return (
        <Form method="post">
            {errors?.summary ? (
                <em className="text-red-600">{errors.summary}</em>
            ) : null}
            <p>
                <label>
                    Post Title:{" "}
                    {errors?.title ? (
                        <em className="text-red-600">{errors.title}</em>
                    ) : null}
                    <input
                        type="text"
                        name="title"
                        className={inputClassName}
                        defaultValue={post.title}
                    />
                </label>
            </p>
            <p>
                <label>
                    Post Slug:{" "}
                    {errors?.slug ? (
                        <em className="text-red-600">{errors.slug}</em>
                    ) : null}
                    <input
                        type="text"
                        name="slug"
                        className={inputClassName}
                        defaultValue={post.slug}
                    />
                </label>
            </p>
            <p>
                <label htmlFor="markdown">Markdown:
                    {errors?.markdown ? (
                        <em className="text-red-600">
                            {errors.markdown}
                        </em>
                    ) : null}
                </label>
                <br />
                <textarea
                    id="markdown"
                    rows={20}
                    name="markdown"
                    className={`${inputClassName} font-mono`}
                    defaultValue={post.markdown}
                />
            </p>
            <p className="text-right">
                <button
                    type="submit"
                    className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
                    disabled={isCreating}
                >
                    {isCreating ? "Updating..." : "Update Post"}
                </button>
            </p>
        </Form>
    );
}