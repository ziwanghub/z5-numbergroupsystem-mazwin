
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RoleRouteProps {
    children: React.ReactElement;
    allowedRoles: string[];
}

const RoleRoute: React.FC<RoleRouteProps> = ({ children, allowedRoles }) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div className="min-h-screen f-center text-slate-500">Verifying Permissions...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(user.role)) {
        // Redirect to standard dashboard if authorized but wrong role
        return <Navigate to="/" replace />;
    }

    return children;
};

export default RoleRoute;
