import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export type UserRole = 'newcomer' | 'lender' | 'borrower' | 'trader' | 'artist' | 'investor';

interface UserActivity {
  hasIdentities: boolean;
  hasAssets: boolean;
  hasLoans: boolean;
  hasOffers: boolean;
  hasListings: boolean;
  reputationScore: number;
  fileCount: number;
  bridgeHistory: number;
}

export const useUserRole = () => {
  const { isAuthenticated, backendActor, lendingActor, marketplaceActor } = useAuth();
  const [primaryRole, setPrimaryRole] = useState<UserRole>('newcomer');
  const [secondaryRoles, setSecondaryRoles] = useState<UserRole[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity>({
    hasIdentities: false,
    hasAssets: false,
    hasLoans: false,
    hasOffers: false,
    hasListings: false,
    reputationScore: 0,
    fileCount: 0,
    bridgeHistory: 0,
  });
  const [loading, setLoading] = useState(true);

  const determineUserRole = (activity: UserActivity): { primary: UserRole; secondary: UserRole[] } => {
    const roles: UserRole[] = [];

    // If user has no activity, they're a newcomer
    if (!activity.hasIdentities && activity.reputationScore === 0) {
      return { primary: 'newcomer', secondary: [] };
    }

    // Determine roles based on activity
    if (activity.hasOffers || (activity.hasLoans && activity.reputationScore > 70)) {
      roles.push('lender');
    }

    if (activity.hasLoans && !activity.hasOffers) {
      roles.push('borrower');
    }

    if (activity.hasListings || activity.bridgeHistory > 2) {
      roles.push('trader');
    }

    if (activity.fileCount > 3 && activity.hasListings) {
      roles.push('artist');
    }

    if (activity.reputationScore > 80 && activity.bridgeHistory > 5) {
      roles.push('investor');
    }

    // Determine primary role based on most activity
    let primary: UserRole = 'newcomer';
    if (roles.includes('lender') && activity.hasOffers) {
      primary = 'lender';
    } else if (roles.includes('trader') && activity.hasListings) {
      primary = 'trader';
    } else if (roles.includes('borrower')) {
      primary = 'borrower';
    } else if (roles.includes('artist')) {
      primary = 'artist';
    } else if (roles.includes('investor')) {
      primary = 'investor';
    } else if (roles.length > 0) {
      primary = roles[0];
    }

    return {
      primary,
      secondary: roles.filter(role => role !== primary)
    };
  };

  useEffect(() => {
    const analyzeUserActivity = async () => {
      if (!isAuthenticated || !backendActor) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get user identities and basic info
        const identities = await backendActor.get_my_identities();
        
        // Calculate average reputation
        const avgReputation = identities.length > 0 
          ? identities.reduce((sum, id) => sum + id.reputation_score, 0) / identities.length
          : 0;

        // Get file count
        const userFiles = await backendActor.get_user_files();

        // Get bridge history
        const bridgeHistory = await backendActor.get_user_bridge_history();

        // Get lending activity (if available)
        let hasLoans = false;
        let hasOffers = false;
        if (lendingActor) {
          try {
            const lendingStats = await lendingActor.get_lending_stats();
            hasLoans = Number(lendingStats.active_loans) > 0;
            // Note: Would need to add user-specific loan/offer check
          } catch (error) {
            console.warn('Could not fetch lending data:', error);
          }
        }

        // Get marketplace activity (if available)
        let hasListings = false;
        if (marketplaceActor) {
          try {
            const marketplaceStats = await marketplaceActor.get_marketplace_stats();
            hasListings = Number(marketplaceStats.active_listings) > 0;
            // Note: Would need to add user-specific listing check
          } catch (error) {
            console.warn('Could not fetch marketplace data:', error);
          }
        }

        const activity: UserActivity = {
          hasIdentities: identities.length > 0,
          hasAssets: identities.some(id => id.linked_assets.length > 0),
          hasLoans,
          hasOffers,
          hasListings,
          reputationScore: avgReputation,
          fileCount: userFiles.length,
          bridgeHistory: bridgeHistory.length,
        };

        setUserActivity(activity);

        const { primary, secondary } = determineUserRole(activity);
        setPrimaryRole(primary);
        setSecondaryRoles(secondary);

      } catch (error) {
        console.error('Failed to analyze user activity:', error);
      } finally {
        setLoading(false);
      }
    };

    analyzeUserActivity();
  }, [isAuthenticated, backendActor, lendingActor, marketplaceActor]);

  const getRoleConfig = (role: UserRole) => {
    const configs = {
      newcomer: {
        title: 'Welcome to GlobalTrust',
        description: 'Start building your digital identity',
        color: 'blue',
        icon: '🌟',
        primaryActions: ['Create Identity', 'Upload Documents', 'Learn More']
      },
      lender: {
        title: 'Lending Dashboard',
        description: 'Manage your loan offers and portfolio',
        color: 'green',
        icon: '🏦',
        primaryActions: ['Create Loan Offer', 'View Active Loans', 'Check Analytics']
      },
      borrower: {
        title: 'Borrowing Hub',
        description: 'Find loans and manage your assets',
        color: 'orange',
        icon: '💰',
        primaryActions: ['Find Loans', 'Upload Collateral', 'Repay Loans']
      },
      trader: {
        title: 'Trading Center',
        description: 'Buy and sell verified assets',
        color: 'purple',
        icon: '📊',
        primaryActions: ['Browse Market', 'List Asset', 'Bridge Assets']
      },
      artist: {
        title: 'Creator Studio',
        description: 'Showcase and monetize your creations',
        color: 'pink',
        icon: '🎨',
        primaryActions: ['Upload Art', 'Create Listing', 'Verify Authenticity']
      },
      investor: {
        title: 'Investment Portfolio',
        description: 'Diversify across chains and assets',
        color: 'indigo',
        icon: '💎',
        primaryActions: ['View Portfolio', 'Analyze Markets', 'Bridge Funds']
      }
    };

    return configs[role];
  };

  return {
    primaryRole,
    secondaryRoles,
    userActivity,
    loading,
    getRoleConfig
  };
};