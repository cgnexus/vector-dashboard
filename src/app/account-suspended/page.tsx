/**
 * Account suspended page
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AccountSuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Account Suspended
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Your account has been temporarily suspended
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your account has been suspended due to security concerns or policy violations. 
              This is a temporary measure to protect your account and our service.
            </p>
            
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                Common reasons for suspension:
              </h3>
              <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                <li>• Multiple failed login attempts</li>
                <li>• Suspicious activity detected</li>
                <li>• Terms of service violation</li>
                <li>• Security policy breach</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button 
                className="w-full" 
                variant="default"
                asChild
              >
                <Link href="mailto:support@nexusapimonitor.com">
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Support
                </Link>
              </Button>
              
              <Button 
                className="w-full" 
                variant="outline"
                asChild
              >
                <Link href="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              If you believe this is an error, please contact our support team. 
              We'll review your account and restore access if appropriate.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}