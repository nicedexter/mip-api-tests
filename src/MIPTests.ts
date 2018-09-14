import {
  ExperimentContainer,
  ExperimentListContainer,
  ModelContainer,
} from '../containers';
import { IExperimentResult, IModelResult, INode } from '../types';
import { IExperiment, IModelSamples } from './mocks';
import { MIME_TYPES } from '../constants';
import tape from 'tape';

const experimentContainer = new ExperimentContainer();
enum sourceType {
  list,
  item,
}

export default class {
  public methodEachErrorCount: number; // FIXME: pure functions
  public methodEachCount: number;
  public methodListErrorCount: number;
  public methodListCount: number;

  constructor() {
    this.methodEachErrorCount = 0;
    this.methodEachCount = 0;
    this.methodListErrorCount = 0;
    this.methodListCount = 0;
  }

  public createModels = async (models: IModelSamples): Promise<boolean> => {
    const create = async () => {
      const modelContainer = new ModelContainer();
      const results = await Promise.all(
        Object.keys(models).map(async key => {
          await modelContainer.load(key);
          let result: IModelResult | undefined = modelContainer.state.model;
          if (result === undefined) {
            await modelContainer.create({
              config: {
                hasXAxis: true,
                height: 480,
                title: {
                  text: key,
                },
                type: 'designmatrix',
                xAxisVariable: null,
                yAxisVariables: ['apoe4'],
              },
              dataset: {
                code: 'DS1528208604241',
                date: 1533814206000,
                grouping: [],
                header: models[key].coVariables.map((v: any) => v.code),
                variable: models[key].variables.map((v: any) => v.code),
              },
              query: models[key],
            });
            result = modelContainer.state.model;
          }

          this.hasNetworkError(modelContainer.state.error);
          if (result) {
            console.log(
              'Model ${result.slug}: ${JSON.stringify(result.query)} ',
            );
          }

          return result;
        }),
      );

      return results.every(v => v !== undefined);
    };

    let modelsCreated: boolean = false;
    do {
      modelsCreated = await create();
    } while (!modelsCreated);

    return Promise.resolve(true);
  }

  public runExperiments = async (
    experiments: IExperiment[],
    models: IModelSamples,
  ): Promise<any> => {
    let experimentCreated: any;
    let experiment = experiments.shift();
    do {
      const model = Object.keys(models).find(
        (key: string) => models[key] === experiment!.model,
      );
      experimentCreated = await this.runAndWaitExperiment(experiment, model);

      if (experimentCreated) {
        experiment = experiments.shift();
      }
    } while (experimentCreated && experiment);

    return Promise.resolve();
  }

  public testEachExperimentResult = async (t: tape.Test): Promise<any> => {
    console.log('\n--- Testing Each Experiment Result');
    const experimentListContainer = new ExperimentListContainer();
    await experimentListContainer.load();
    const experiments: IExperimentResult[] | undefined =
      experimentListContainer.state.experiments;

    this.hasNetworkError(experimentListContainer.state.error);

    if (experiments) {
      const experimentsCount = experiments.length;
      let experiment = experiments.shift(); // FIXME: should be unmutable
      if (experiment) {
        do {
          await experimentContainer.load(experiment.uuid);
          const theExperiment = experimentContainer.state.experiment;
          if (theExperiment) {
            this.testExperiment(theExperiment, sourceType.item, t);
          }
          experiment = experiments.shift();
        } while (experiment);

        t.comment(
          `\n------------------------------------------------------------\n${
            this.methodEachErrorCount
          } methods on ${
            this.methodEachCount
          } had errors on ${experimentsCount} experiments\n------------------------------------------------------------\n`,
        );

        return true;
      }
    }
  }

  public testExperimentListResults = async (t: tape.Test) => {
    console.log('\n--- Testing Experiment List Results');
    const experimentListContainer = new ExperimentListContainer();
    await experimentListContainer.load();
    const experiments: IExperimentResult[] | undefined =
      experimentListContainer.state.experiments;

    t.error(
      this.hasNetworkError(experimentListContainer.state.error),
      'No network error',
    );

    t.ok(experiments, 'Experiments response from server');

    if (experiments) {
      const result = Promise.all(
        experiments.map((experiment: IExperimentResult) =>
          this.testExperiment(experiment, sourceType.list, t),
        ),
      );
      t.comment(
        `\n------------------------------------------------------------\n ${
          this.methodListErrorCount
        } methods on ${this.methodListCount} had errors on ${
          experiments.length
        } experiments \n------------------------------------------------------------\n`,
      );

      return result;
    }

    return false;
  }

  private testExperiment = (
    experiment: IExperimentResult,
    from: sourceType,
    t: tape.Test,
  ): boolean => {
    t.comment(`--- name: ${experiment.name}`);

    from === sourceType.item
              ? this.methodEachCount += experiment.algorithms.length
              : this.methodListCount += experiment.algorithms.length;

    t.ok(
      experiment.algorithms.every((a: any) => a),
      `algorithms: ${experiment.algorithms}`,
    );
    t.ok(experiment.created, 'created');
    t.ok(experiment.name, 'name');
    t.ok(
      typeof experiment.resultsViewed === 'boolean',
      `resultsViewed: ${experiment.resultsViewed}`,
    );
    t.ok(experiment.uuid, `uuid: ${experiment.uuid}`);
    t.ok(
      experiment.modelDefinitionId,
      `modelDefinitionId: ${experiment.modelDefinitionId}`,
    );
    t.ok(
      experiment.user.fullname,
      `user fullname: ${experiment.user.fullname}`,
    );
    t.ok(experiment.user.username, 'user.username');

    if (experiment.nodes) {
      const nodes: INode[] = experiment.nodes;
      nodes.forEach(node => {
        t.ok(node.name, `node.name: ${node.name}`);
        t.ok(node.methods, `node.methods: ${node.methods.length}`);

        node.methods.forEach((method, i) => {
          t.ok(method.mime, `method.mime: ${method.mime}`);
          t.ok(method.algorithm, `method.algorithm: ${method.algorithm}`);
          t.ok(method.data || method.error, 'method.data || method.error');

          if (!method.error) {
            t.ok(
              node.methods.length === experiment.algorithms.length,
              `node.methods.length === experiment.algorithms.length: ${
                node.methods.length
              } === ${experiment.algorithms.length}`,
            );

            t.ok(
              method.data,
              `method.data: ${method.data!.map(d =>
                JSON.stringify(d).substr(0, 20),
              )}`,
            );
            if (method.data) {
              t.ok(method.data.length, `method.data is array`);

              switch (method.mime) {
                case MIME_TYPES.HIGHCHARTS:
                  method &&
                    method.data.map(d =>
                      t.ok(d.series, `method.data[].d.chart`),
                    );
                  break;

                case MIME_TYPES.PLOTLY:
                  method &&
                    method.data.map(d => t.ok(d.data, `method.data[].d.data`));
                  break;

                case MIME_TYPES.PFA:
                  method &&
                    method.data.map((data, j) => {
                      if (data.error && i === 0 && j === 0) {
                        from === sourceType.item
                          ? this.methodEachErrorCount++
                          : this.methodListErrorCount++;
                      } else {
                        t.ok(
                          data.crossValidation || data.remoteValidation,
                          `data.crossValidation || data.remoteValidation`,
                        );

                        if (data.crossValidation) {
                          t.ok(Object.keys(data.crossValidation), `crossValidation keys: ${Object.keys(data.crossValidation)}`);
                          if (data.crossValidation.confusionMatrix) {
                            t.ok(
                              Object.keys(data.crossValidation.confusionMatrix),
                              `confusionMatrix keys: ${Object.keys(data.crossValidation.confusionMatrix)}`
                            );
                          }
                        }

                        if (data.remoteValidation) {
                          t.ok(Object.keys(data.remoteValidation), `remoteValidation keys: ${Object.keys(data.remoteValidation)}`);
                          if (data.remoteValidation.confusionMatrix) {
                            t.ok(
                              Object.keys(data.remoteValidation.confusionMatrix)
                              , `confusionMatrix keys: ${Object.keys(data.remoteValidation.confusionMatrix)}`
                            );
                          }
                        }
                      }
                    });
                  break;

                case MIME_TYPES.JSON:
                  method &&
                    method.data.map(d =>
                      t.ok(Object.keys(d), `Object.keys(data[].d)`),
                    );
                  break;

                case MIME_TYPES.VISJS: // EXAREME
                  method &&
                    method.data.map(d =>
                      t.ok(d.match(/script/), `d.match(/script/)`),
                    );
                  break;

                case MIME_TYPES.ERROR:
                  from === sourceType.item
                    ? this.methodEachErrorCount++
                    : this.methodListErrorCount++;
                  t.ok(method.error, `method.error ${method.error}`);
                  break;

                case MIME_TYPES.JSONDATA:
                  t.fail(MIME_TYPES.JSONDATA);
                  break;

                default:
                  t.fail(method.mime);
              }
            }
          } else {
            from === sourceType.item
              ? this.methodEachErrorCount++
              : this.methodListErrorCount++;
            t.comment(`Error: ${method.error}`);
          }
        });
      });
    } else if (experiment.error) {
      t.ok(experiment.error, `Error: ${experiment.error}`);
      from === sourceType.item
        ? this.methodEachErrorCount++
        : this.methodListErrorCount++;
    } else {
      const elapsed: number =
        (new Date().getTime() - experiment.created.getTime()) / 1000;

      t.ok(elapsed > 60 * 5, 'experiment is loading');
    }

    return true;
  }

  private hasNetworkError = (error: string | undefined): boolean => {
    if (
      (error && error.match(/ECONNREFUSED/)) ||
      (error && error.match(/Forbidden/))
    ) {
      console.log({ error });
      return true;
    }

    return false;
  }

  private runAndWaitExperiment = async (
    experiment: any,
    model: any,
  ): Promise<boolean | any> => {
    return new Promise(async resolve => {
      const exp = {
        algorithms: experiment.methods.map((m: any) => ({
          code: m.code,
          name: m.code,
          parameters: m.parameters,
          validation: experiment.validations.length ? true : false,
        })),
        model,
        name: experiment.name,
        validations: experiment.validations,
      };
      await experimentContainer.create(exp);

      const created: IExperimentResult | undefined =
        experimentContainer.state.experiment;
      const uuid: string | undefined = created && created.uuid;
      console.log('created', exp.name, uuid);

      this.hasNetworkError(experimentContainer.state.error);

      if (uuid) {
        const timerId = setInterval(async () => {
          const loading = await this.experimentLoadingStatus(uuid);
          console.log({ loading });
          if (!loading) {
            clearInterval(timerId);
            resolve(true);
          }
        },                          10 * 1000);
      }
    });
  }

  private experimentLoadingStatus = async (uuid: string): Promise<boolean> => {
    await experimentContainer.load(uuid);
    const state = experimentContainer.state;
    const experiment: IExperimentResult | undefined = state.experiment;

    const nodes = experiment && experiment.nodes;
    const error = (state && state.error) || (experiment && experiment.error);
    const loading = !nodes && !error;

    return loading;
  }
}
