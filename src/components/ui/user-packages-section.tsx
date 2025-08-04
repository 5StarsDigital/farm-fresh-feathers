import PackageTransactionDetails from './package-transaction-details';

interface UserPackagesSectionProps {
  farmId: string | undefined;
  refreshTrigger?: number;
}

const UserPackagesSection = ({ farmId, refreshTrigger }: UserPackagesSectionProps) => {
  return <PackageTransactionDetails farmId={farmId} refreshTrigger={refreshTrigger} />;
};

export default UserPackagesSection;