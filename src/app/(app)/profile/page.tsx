'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

// --- Helper Components --------------------------------------------------------

const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        {children}
    </div>
);

const CardHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
    </div>
);

const CardContent = ({ children }: { children: React.ReactNode }) => (
    <div className="p-6 space-y-4">
        {children}
    </div>
);

const CardFooter = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-gray-50 dark:bg-gray-900/50 p-6 flex justify-end">
        {children}
    </div>
);

// --- Main Profile Page ------------------------------------------------------

export default function ProfilePage() {
    const { user, loading } = useAuth();

    // State for forms
    const [fullName, setFullName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [profilePic, setProfilePic] = useState(user?.profilePicUrl || 'https://avatar.vercel.sh/clearbook.svg?size=120');

    if (loading || !user) {
        return <div>Loading user profile...</div>; // Or a spinner component
    }

    const handleProfileUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Add API call to update user name and email
        console.log('Updating profile:', { fullName, email });
        // On success, show a notification
    };

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert("New passwords do not match.");
            return;
        }
        // TODO: Add API call to change password
        console.log('Changing password...');
        // On success, clear fields and show a notification
    };

    const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                setProfilePic(event.target?.result as string);
            };
            reader.readAsDataURL(file);
            // TODO: Add API call to upload the file to your backend
        }
    };

    return (
        <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50 mb-8">Your Profile</h1>
            <div className="space-y-8">
                {/* Profile Picture Section */}
                <Card>
                    <CardHeader 
                        title="Profile Picture"
                        subtitle="Update your avatar. A clear picture makes it easier for your team to recognize you."
                    />
                    <form>
                        <CardContent>
                            <div className="flex items-center gap-6">
                                <img 
                                    src={profilePic}
                                    alt="Profile Picture"
                                    className="w-20 h-20 rounded-full object-cover"
                                />
                                <div className="flex gap-4">
                                    <Label htmlFor="profile-pic-upload" className="cursor-pointer">
                                        <Button asChild>
                                            <span>Upload New</span>
                                        </Button>
                                        <input id="profile-pic-upload" type="file" className="sr-only" onChange={handleProfilePicChange} accept="image/*" />
                                    </Label>
                                    <Button variant="outline" onClick={() => setProfilePic('https://avatar.vercel.sh/clearbook.svg?size=120')}>Remove</Button>
                                </div>
                            </div>
                        </CardContent>
                    </form>
                </Card>

                {/* Personal Information Section */}
                <Card>
                    <form onSubmit={handleProfileUpdate}>
                        <CardHeader 
                            title="Personal Information"
                            subtitle="Update your name and email address."
                        />
                        <CardContent>
                            <div>
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g., John Doe" required className="mt-1"/>
                            </div>
                            <div>
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g., you@example.com" required className="mt-1"/>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit">Save Changes</Button>
                        </CardFooter>
                    </form>
                </Card>

                {/* Password Change Section */}
                <Card>
                    <form onSubmit={handlePasswordChange}>
                        <CardHeader 
                            title="Change Password"
                            subtitle="For your security, choose a strong and unique password."
                        />
                        <CardContent>
                            <div>
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <Input id="currentPassword" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="mt-1"/>
                            </div>
                             <div>
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="mt-1"/>
                            </div>
                             <div>
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="mt-1"/>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit">Update Password</Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
