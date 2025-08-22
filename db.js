// Database functions for The Python Weekly Brief
// Handles all database operations using Supabase

// Get the latest published issue
async function getLatestIssue() {
    try {
        const { data: issue, error } = await supabase
            .from('issues')
            .select('*')
            .not('published_at', 'is', null)
            .order('published_at', { ascending: false })
            .limit(1)
            .single();

        if (error) throw error;

        return { success: true, data: issue };
    } catch (error) {
        console.error('Error getting latest issue:', error);
        return { success: false, message: error.message };
    }
}

// Get all published issues
async function getAllIssues() {
    try {
        const { data: issues, error } = await supabase
            .from('issues')
            .select('*')
            .not('published_at', 'is', null)
            .order('published_at', { ascending: false });

        if (error) throw error;

        return { success: true, data: issues };
    } catch (error) {
        console.error('Error getting all issues:', error);
        return { success: false, message: error.message };
    }
}

// Get issue by slug
async function getIssueBySlug(slug) {
    try {
        const { data: issue, error } = await supabase
            .from('issues')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) throw error;

        return { success: true, data: issue };
    } catch (error) {
        console.error('Error getting issue by slug:', error);
        return { success: false, message: error.message };
    }
}

// Get issues by year
async function getIssuesByYear(year) {
    try {
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;

        const { data: issues, error } = await supabase
            .from('issues')
            .select('*')
            .gte('published_at', startDate)
            .lte('published_at', endDate)
            .not('published_at', 'is', null)
            .order('published_at', { ascending: false });

        if (error) throw error;

        return { success: true, data: issues };
    } catch (error) {
        console.error('Error getting issues by year:', error);
        return { success: false, message: error.message };
    }
}

// Search issues
async function searchIssues(query) {
    try {
        const { data: issues, error } = await supabase
            .from('issues')
            .select('*')
            .or(`title.ilike.%${query}%,short_summary.ilike.%${query}%,full_content.ilike.%${query}%`)
            .not('published_at', 'is', null)
            .order('published_at', { ascending: false });

        if (error) throw error;

        return { success: true, data: issues };
    } catch (error) {
        console.error('Error searching issues:', error);
        return { success: false, message: error.message };
    }
}

// Get user data
async function getUserData(userId) {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;

        return { success: true, data: user };
    } catch (error) {
        console.error('Error getting user data:', error);
        return { success: false, message: error.message };
    }
}

// Update user premium status
async function updateUserPremiumStatus(userId, isPremium) {
    try {
        const { error } = await supabase
            .from('users')
            .update({ is_premium: isPremium })
            .eq('id', userId);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Error updating user premium status:', error);
        return { success: false, message: error.message };
    }
}

// Update user admin status
async function updateUserAdminStatus(userId, isAdmin) {
    try {
        const { error } = await supabase
            .from('users')
            .update({ is_admin: isAdmin })
            .eq('id', userId);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Error updating user admin status:', error);
        return { success: false, message: error.message };
    }
}

// Get all users (admin only)
async function getAllUsers() {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return { success: true, data: users };
    } catch (error) {
        console.error('Error getting all users:', error);
        return { success: false, message: error.message };
    }
}

// Create new issue
async function createIssue(issueData) {
    try {
        const { data: issue, error } = await supabase
            .from('issues')
            .insert([issueData])
            .select()
            .single();

        if (error) throw error;

        return { success: true, data: issue };
    } catch (error) {
        console.error('Error creating issue:', error);
        return { success: false, message: error.message };
    }
}

// Update issue
async function updateIssue(issueId, issueData) {
    try {
        const { data: issue, error } = await supabase
            .from('issues')
            .update(issueData)
            .eq('id', issueId)
            .select()
            .single();

        if (error) throw error;

        return { success: true, data: issue };
    } catch (error) {
        console.error('Error updating issue:', error);
        return { success: false, message: error.message };
    }
}

// Delete issue
async function deleteIssue(issueId) {
    try {
        const { error } = await supabase
            .from('issues')
            .delete()
            .eq('id', issueId);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Error deleting issue:', error);
        return { success: false, message: error.message };
    }
}

// Get user statistics
async function getUserStats() {
    try {
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('is_premium, created_at');

        if (userError) throw userError;

        const totalUsers = users.length;
        const premiumUsers = users.filter(user => user.is_premium).length;
        const freeUsers = totalUsers - premiumUsers;

        // Get this month's new users
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const newThisMonth = users.filter(user => {
            const userDate = new Date(user.created_at);
            return userDate.getMonth() === thisMonth && userDate.getFullYear() === thisYear;
        }).length;

        // Get this month's new issues
        const { data: issues, error: issueError } = await supabase
            .from('issues')
            .select('published_at')
            .not('published_at', 'is', null);

        if (issueError) throw issueError;

        const thisMonthIssues = issues.filter(issue => {
            const issueDate = new Date(issue.published_at);
            return issueDate.getMonth() === thisMonth && issueDate.getFullYear() === thisYear;
        }).length;

        const stats = {
            totalUsers,
            premiumUsers,
            freeUsers,
            newThisMonth,
            thisMonthIssues,
            conversionRate: totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0
        };

        return { success: true, data: stats };
    } catch (error) {
        console.error('Error getting user stats:', error);
        return { success: false, message: error.message };
    }
}

// Get issue statistics
async function getIssueStats() {
    try {
        const { data: issues, error } = await supabase
            .from('issues')
            .select('published_at, has_download');

        if (error) throw error;

        const totalIssues = issues.length;
        const publishedIssues = issues.filter(issue => issue.published_at).length;
        const draftIssues = totalIssues - publishedIssues;
        const issuesWithDownloads = issues.filter(issue => issue.has_download).length;

        // Get this month's issues
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const thisMonthIssues = issues.filter(issue => {
            if (!issue.published_at) return false;
            const issueDate = new Date(issue.published_at);
            return issueDate.getMonth() === thisMonth && issueDate.getFullYear() === thisYear;
        }).length;

        const stats = {
            totalIssues,
            publishedIssues,
            draftIssues,
            issuesWithDownloads,
            thisMonthIssues
        };

        return { success: true, data: stats };
    } catch (error) {
        console.error('Error getting issue stats:', error);
        return { success: false, message: error.message };
    }
}

// Check if user can access premium content
async function canAccessPremiumContent(userId) {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('is_premium')
            .eq('id', userId)
            .single();

        if (error) throw error;

        return user?.is_premium || false;
    } catch (error) {
        console.error('Error checking premium access:', error);
        return false;
    }
}

// Get user's reading history (for future features)
async function getUserReadingHistory(userId) {
    try {
        // This would be implemented when reading history tracking is added
        // For now, return empty array
        return { success: true, data: [] };
    } catch (error) {
        console.error('Error getting reading history:', error);
        return { success: false, message: error.message };
    }
}

// Export functions for use in other scripts
window.db = {
    getLatestIssue,
    getAllIssues,
    getIssueBySlug,
    getIssuesByYear,
    searchIssues,
    getUserData,
    updateUserPremiumStatus,
    updateUserAdminStatus,
    getAllUsers,
    createIssue,
    updateIssue,
    deleteIssue,
    getUserStats,
    getIssueStats,
    canAccessPremiumContent,
    getUserReadingHistory
};
