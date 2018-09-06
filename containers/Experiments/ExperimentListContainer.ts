// tslint:disable:no-console
import { IExperimentResult, IExperimentListContainer} from ".../../../types";
import * as dotenv from "dotenv";
import request from "request-promise-native";
import { Container } from "unstated";
import { config } from "../../tests/mocks";
import ParseExperiment from "./ParseExperiment";
dotenv.config();

export interface IResult {
  uuid: string;
  name: string;
}

class ExperimentListContainer extends Container<IExperimentListContainer> {
  private baseUrl = `${process.env.REACT_APP_BACKEND_URL}/experiments`;

  constructor() {
    super();
    this.state = {
      error: undefined,
      experiments: undefined,
      loading: true
    };
  }
  
  public load = async () => {
    await this.setState({ loading: true });
    try {
      const data = await request.get(`${this.baseUrl}?mine=true`, config);
      const json = await JSON.parse(data);
      if (json.error) {
        return await this.setState({
          error: json.error,
          loading: false
        });
      }

      return await this.setState({
        error: undefined,
        experiments: json.map((j: IExperimentResult) =>
          ParseExperiment.parse(j)
        ),
        loading: false
      });
    } catch (error) {
      console.log(error);
      return await this.setState({
        error: error.message,
        loading: false
      });
    }
  };
}

export default ExperimentListContainer;
