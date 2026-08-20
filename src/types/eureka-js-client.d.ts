declare module 'eureka-js-client' {
  export interface EurekaPort {
    $: number;
    '@enabled': string;
  }

  export interface EurekaInstanceConfig {
    app: string;
    hostName: string;
    ipAddr: string;
    port: EurekaPort;
    vipAddress: string;
    statusPageUrl?: string;
    healthCheckUrl?: string;
    dataCenterInfo: {
      '@class': string;
      name: 'MyOwn' | 'Amazon';
    };
  }

  export interface EurekaServerConfig {
    host: string;
    port: number;
    servicePath?: string;
  }

  export interface EurekaConfig {
    instance: EurekaInstanceConfig;
    eureka: EurekaServerConfig;
  }

  export class Eureka {
    constructor(config: EurekaConfig);
    start(callback?: (error?: Error) => void): void;
    stop(callback?: (error?: Error) => void): void;
  }
}
