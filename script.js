// Main JavaScript functionality for The Python Weekly Brief
// Handles UI interactions and content loading

// Global variables
let currentUser = null;
let isUserPremium = false;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        // Check authentication status
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
            currentUser = user;
            await checkPremiumStatus();
        }

        // Load latest issue
        await loadLatestIssue();
        
        // Setup event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

async function checkPremiumStatus() {
    if (!currentUser) return false;

    try {
        const { data: userData } = await supabase
            .from('users')
            .select('is_premium')
            .eq('id', currentUser.id)
            .single();

        isUserPremium = userData?.is_premium || false;
        return isUserPremium;
    } catch (error) {
        console.error('Error checking premium status:', error);
        return false;
    }
}

async function loadLatestIssue() {
    const latestIssueCard = document.getElementById('latest-issue-card');
    if (!latestIssueCard) return;

    try {
        const result = await window.db.getLatestIssue();
        
        if (result.success && result.data) {
            const issue = result.data;
            displayLatestIssue(issue);
        } else {
            latestIssueCard.innerHTML = `
                <div class="no-issues">
                    <h3>No Issues Published Yet</h3>
                    <p>Check back soon for the latest Python development news!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading latest issue:', error);
        latestIssueCard.innerHTML = `
            <div class="error">
                <p>Error loading latest issue: ${error.message}</p>
            </div>
        `;
    }
}

function displayLatestIssue(issue) {
    const latestIssueCard = document.getElementById('latest-issue-card');
    if (!latestIssueCard) return;

    const issueDate = new Date(issue.published_at).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    latestIssueCard.innerHTML = `
        <div class="issue-header">
            <h3>${issue.title}</h3>
            <span class="issue-date">${issueDate}</span>
        </div>
        
        <div class="issue-summary">
            <h4>This Week's Highlights</h4>
            <div class="summary-content">
                ${issue.short_summary.split('\n').map(line => 
                    line.trim() ? `<p>${line}</p>` : ''
                ).join('')}
            </div>
        </div>

        ${isUserPremium ? `
            <div class="issue-full-content">
                <h4>Full Content</h4>
                <div class="content-preview">
                    ${issue.full_content.substring(0, 400)}${issue.full_content.length > 400 ? '...' : ''}
                </div>
                <div class="issue-actions">
                    <a href="/archive/${issue.slug}" class="btn btn-primary">Read Full Issue</a>
                    ${issue.has_download ? `
                        <a href="${issue.download_url}" class="btn btn-outline" target="_blank">
                            📥 Download Resource
                        </a>
                    ` : ''}
                </div>
            </div>
        ` : `
            <div class="issue-premium-lock">
                <div class="premium-lock-icon">🔒</div>
                <h4>Unlock Full Content</h4>
                <p>Upgrade to Premium to read the complete issue and access downloadable resources.</p>
                <div class="premium-cta">
                    <button class="btn btn-primary" onclick="showAuthModal('signup')">
                        Upgrade to Premium - $9.99/month
                    </button>
                    <p class="premium-note">Cancel anytime. No commitment required.</p>
                </div>
            </div>
        `}
        
        <div class="issue-footer">
            <span class="issue-slug">${issue.slug}</span>
            ${issue.has_download ? '<span class="download-badge">📥</span>' : ''}
        </div>
    `;
}

function setupEventListeners() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Mobile menu toggle (if mobile menu exists)
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }

    // Search functionality (if search exists)
    const searchInput = document.querySelector('#search-issues');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
}

function scrollToLatestIssue() {
    const latestIssueSection = document.getElementById('latest-issue');
    if (latestIssueSection) {
        latestIssueSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

function toggleMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('active');
    }
}

function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    // Implement search functionality as needed
    console.log('Searching for:', searchTerm);
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Premium upgrade functions
async function upgradeToPremium() {
    if (!currentUser) {
        showAuthModal('signup');
        return;
    }

    // This will be implemented when Stripe is added
    alert('Premium upgrade functionality will be available soon!');
}

// Newsletter subscription functions
async function subscribeToNewsletter(email) {
    try {
        // This would integrate with your email service provider
        // For now, just show a success message
        alert('Thank you for subscribing! You\'ll receive our latest updates soon.');
        
        // Clear the email input
        const emailInput = document.querySelector('#newsletter-email');
        if (emailInput) {
            emailInput.value = '';
        }
    } catch (error) {
        console.error('Error subscribing to newsletter:', error);
        alert('Error subscribing to newsletter: ' + error.message);
    }
}

// Handle newsletter form submission
function handleNewsletterSubmit(event) {
    event.preventDefault();
    
    const emailInput = event.target.querySelector('input[type="email"]');
    const email = emailInput.value.trim();
    
    if (!email) {
        alert('Please enter a valid email address.');
        return;
    }
    
    if (!isValidEmail(email)) {
        alert('Please enter a valid email address.');
        return;
    }
    
    subscribeToNewsletter(email);
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Social sharing functions
function shareOnTwitter(title, url) {
    const text = encodeURIComponent(title);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank');
}

function shareOnLinkedIn(title, url) {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedinUrl, '_blank');
}

// Analytics tracking (for future implementation)
function trackEvent(eventName, eventData = {}) {
    // This would integrate with Google Analytics or similar
    console.log('Tracking event:', eventName, eventData);
}

// Performance monitoring
function measurePageLoadTime() {
    if ('performance' in window) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        console.log('Page load time:', loadTime + 'ms');
        trackEvent('page_load_time', { loadTime });
    }
}

// Error handling
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    trackEvent('error', { 
        message: event.error?.message || 'Unknown error',
        filename: event.filename,
        lineno: event.lineno
    });
});

// Export functions for use in other scripts
window.newsletterApp = {
    upgradeToPremium,
    subscribeToNewsletter,
    shareOnTwitter,
    shareOnLinkedIn,
    trackEvent,
    scrollToLatestIssue
};

// Measure page load time when everything is loaded
window.addEventListener('load', measurePageLoadTime);

