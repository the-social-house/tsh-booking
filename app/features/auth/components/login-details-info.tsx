import { Card, CardContent } from "@/components/ui/card";

function LoginDetailsInfo() {
  return (
    <Card className="bottom-4 left-4 border-blue-500 bg-blue-200 p-2 md:fixed">
      <CardContent className="space-y-2 px-2">
        <h2 className="font-medium text-lg">Login details</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="space-y-3 rounded border border-blue-500 p-2">
              <p className="font-medium text-sm">Admin</p>
              <div>
                <p className="text-xs">Email</p>
                <p className="text-sm">admin@test.com</p>
              </div>
              <div>
                <p className="text-xs">Password</p>
                <p className="text-sm">tsh12345</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="space-y-3 rounded border border-blue-500 p-2">
              <p className="font-medium text-sm">User</p>
              <div>
                <p className="text-xs">Email</p>
                <p className="text-sm">user@test.com</p>
              </div>
              <div>
                <p className="text-xs">Password</p>
                <p className="text-sm">tsh12345</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default LoginDetailsInfo;
