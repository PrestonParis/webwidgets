export async function getUserOrThrow(supabase) {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) throw new Error('Unauthorized');

    return user;
}
