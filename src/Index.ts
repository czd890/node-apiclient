import { ApiClient, IApiClient } from './ApiClient'

export * from './ApiClient'


const instance: IApiClient = new ApiClient();
export default instance;