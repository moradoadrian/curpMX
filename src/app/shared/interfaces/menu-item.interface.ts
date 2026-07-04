export interface MenuItem {
  title: string;
  description: string;
  icon: string;
  route: string;
  disabled?: boolean;
  badge?: string;
}
