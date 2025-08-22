// Authentication functions for The Python Weekly Brief
let currentUser = null;
let authModal = null;

// Initialize authentication
document.addEventListener('DOMContentLoaded', function() {
    authModal = document.getElementById('auth-modal');
    initializeAuth();
});

async function initializeAuth() {
    try {
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            currentUser = session.user;
            await handleUserLogin(session.user);
        }

        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                currentUser = session.user;
                await handleUserLogin(session.user);
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                handleUserLogout();
            }
        });
    } catch (error) {
        console.error('Error initializing auth:', error);
    }
}

async function handleUserLogin(user) {
    try {
        // Check if user exists in our users table
        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError;
        }

        if (!existingUser) {
            // Create new user record
            const { error: insertError } = await supabase
                .from('users')
                .insert([{
                    id: user.id,
                    email: user.email,
                    is_premium: false,
                    is_admin: false,
                    created_at: new Date().toISOString()
                }]);

            if (insertError) throw insertError;
        }

        // Update UI
        updateAuthUI(user);
        
        // Close auth modal if open
        if (authModal) {
            closeAuthModal();
        }

    } catch (error) {
        console.error('Error handling user login:', error);
        alert('Error setting up user account: ' + error.message);
    }
}

function handleUserLogout() {
    updateAuthUI(null);
}

function updateAuthUI(user) {
    const authButtons = document.querySelector('.auth-buttons');
    const userInfo = document.querySelector('.user-info');
    const adminLinks = document.querySelector('.admin-links');

    if (user) {
        // User is logged in
        if (authButtons) authButtons.style.display = 'none';
        if (userInfo) {
            userInfo.style.display = 'block';
            userInfo.innerHTML = `
                <span class="user-email">${user.email}</span>
                <div class="user-avatar">${user.email.charAt(0).toUpperCase()}</div>
            `;
        }

        // Check if user is admin
        checkAdminStatus(user.id).then(isAdmin => {
            if (adminLinks) {
                adminLinks.style.display = isAdmin ? 'block' : 'none';
            }
        });

    } else {
        // User is logged out
        if (authButtons) authButtons.style.display = 'block';
        if (userInfo) userInfo.style.display = 'none';
        if (adminLinks) adminLinks.style.display = 'none';
    }
}

async function checkAdminStatus(userId) {
    try {
        const { data: userData } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', userId)
            .single();

        return userData?.is_admin || false;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

// Show authentication modal
function showAuthModal(type) {
    if (!authModal) return;

    const authContent = document.getElementById('auth-content');
    
    if (type === 'login') {
        authContent.innerHTML = `
            <div class="auth-form">
                <h2>Sign In</h2>
                <form id="login-form">
                    <div class="form-group">
                        <label for="login-email">Email</label>
                        <input type="email" id="login-email" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="login-password">Password</label>
                        <input type="password" id="login-password" class="form-input" required>
                    </div>
                    <button type="submit" class="btn btn-primary btn-full">Sign In</button>
                </form>
                <div class="auth-links">
                    <p>Don't have an account? <a href="#" onclick="showAuthModal('signup')">Sign up</a></p>
                    <p><a href="#" onclick="showAuthModal('forgot-password')">Forgot password?</a></p>
                </div>
            </div>
        `;

        // Add form submission handler
        document.getElementById('login-form').addEventListener('submit', handleLogin);
    } else if (type === 'signup') {
        authContent.innerHTML = `
            <div class="auth-form">
                <h2>Create Account</h2>
                <form id="signup-form">
                    <div class="form-group">
                        <label for="signup-email">Email</label>
                        <input type="email" id="signup-email" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="signup-password">Password</label>
                        <input type="password" id="signup-password" class="form-input" required minlength="6">
                        <small>Minimum 6 characters</small>
                    </div>
                    <div class="form-group">
                        <label for="signup-confirm-password">Confirm Password</label>
                        <input type="password" id="signup-confirm-password" class="form-input" required>
                    </div>
                    <button type="submit" class="btn btn-primary btn-full">Create Account</button>
                </form>
                <div class="auth-links">
                    <p>Already have an account? <a href="#" onclick="showAuthModal('login')">Sign in</a></p>
                </div>
            </div>
        `;

        // Add form submission handler
        document.getElementById('signup-form').addEventListener('submit', handleSignup);
    } else if (type === 'forgot-password') {
        authContent.innerHTML = `
            <div class="auth-form">
                <h2>Reset Password</h2>
                <form id="forgot-password-form">
                    <div class="form-group">
                        <label for="reset-email">Email</label>
                        <input type="email" id="reset-email" class="form-input" required>
                    </div>
                    <button type="submit" class="btn btn-primary btn-full">Send Reset Link</button>
                </form>
                <div class="auth-links">
                    <p><a href="#" onclick="showAuthModal('login')">Back to Sign In</a></p>
                </div>
            </div>
        `;

        // Add form submission handler
        document.getElementById('forgot-password-form').addEventListener('submit', handleForgotPassword);
    }

    authModal.style.display = 'block';
}

// Close authentication modal
function closeAuthModal() {
    if (authModal) {
        authModal.style.display = 'none';
    }
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        // Success - user will be handled by auth state change listener
        console.log('Login successful');

    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
    }
}

// Handle signup form submission
async function handleSignup(event) {
    event.preventDefault();
    
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (error) throw error;

        // Show success message
        const authContent = document.getElementById('auth-content');
        authContent.innerHTML = `
            <div class="auth-success">
                <h2>Account Created!</h2>
                <p>Please check your email to verify your account before signing in.</p>
                <button class="btn btn-primary" onclick="closeAuthModal()">Close</button>
            </div>
        `;

    } catch (error) {
        console.error('Signup error:', error);
        alert('Signup failed: ' + error.message);
    }
}

// Handle forgot password form submission
async function handleForgotPassword(event) {
    event.preventDefault();
    
    const email = document.getElementById('reset-email').value;

    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password'
        });

        if (error) throw error;

        // Show success message
        const authContent = document.getElementById('auth-content');
        authContent.innerHTML = `
            <div class="auth-success">
                <h2>Reset Link Sent!</h2>
                <p>Check your email for a password reset link.</p>
                <button class="btn btn-primary" onclick="closeAuthModal()">Close</button>
            </div>
        `;

    } catch (error) {
        console.error('Password reset error:', error);
        alert('Password reset failed: ' + error.message);
    }
}

// Sign out user
async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        // Redirect to home page
        window.location.href = '/';
    } catch (error) {
        console.error('Sign out error:', error);
        alert('Sign out failed: ' + error.message);
    }
}

// Check if user is premium
async function isUserPremium() {
    if (!currentUser) return false;

    try {
        const { data: userData } = await supabase
            .from('users')
            .select('is_premium')
            .eq('id', currentUser.id)
            .single();

        return userData?.is_premium || false;
    } catch (error) {
        console.error('Error checking premium status:', error);
        return false;
    }
}

// Check if user is admin
async function isUserAdmin() {
    if (!currentUser) return false;

    try {
        const { data: userData } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', currentUser.id)
            .single();

        return userData?.is_admin || false;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target === authModal) {
        closeAuthModal();
    }
}

// Export functions for use in other scripts
window.showAuthModal = showAuthModal;
window.closeAuthModal = closeAuthModal;
window.signOut = signOut;
window.isUserPremium = isUserPremium;
window.isUserAdmin = isUserAdmin;
