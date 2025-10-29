declare module "aos" {
  // minimal typing to satisfy dynamic imports and usage of AOS.init
  export function init(options?: any): void;
  const Aos: any;
  export default Aos;
}
