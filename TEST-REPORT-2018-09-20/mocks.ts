import * as dotenv from 'dotenv';
dotenv.config();

const trainingDatasetsValue = process.env.TRAININGDATASETS;
const trainingDatasets = trainingDatasetsValue
  ? trainingDatasetsValue.split(',')
  : [];
const validationDatasetsValue = process.env.VALIDATIONDATASETS;
const validationDatasets: string[] = validationDatasetsValue
  ? validationDatasetsValue.split(',')
  : [];
const Cookie = process.env.COOKIE;

export const config: any = {
  headers: {
    Authorization: process.env.AUTHORIZATION!,
    Cookie,
    'X-XSRF-TOKEN': (Cookie && Cookie.match(/XSRF-TOKEN=(.*)/)![1]) || '',
  },
};

interface ICode {
  code: string;
}

export interface IModelSamples {
  [key: string]: IModel;
}

export interface IModel {
  coVariables: ICode[];
  filters: string;
  groupings: ICode[];
  testingDatasets: string[];
  trainingDatasets: string[];
  validationDatasets: string[];
  variables: ICode[];
}

export interface IModelNames {
  [key: string]: IModel;
  classification20: IModel;
  classification21: IModel;
  regression20: IModel;
  regression21: IModel;
}

export const models: IModelNames = {
  classification20: {
    coVariables: [{ code: 'lefthippocampus' }],
    filters: '',
    groupings: [],
    testingDatasets: [],
    trainingDatasets,
    validationDatasets,
    variables: [{ code: 'alzheimerbroadcategory' }],
  },
  classification21: {
    coVariables: [{ code: 'apoe4' }],
    filters: '',
    groupings: [],
    testingDatasets: [],
    trainingDatasets,
    validationDatasets,
    variables: [{ code: 'alzheimerbroadcategory' }],
  },
  regression20: {
    coVariables: [{ code: 'lefthippocampus' }, { code: 'righthippocampus' }],
    filters: '',
    groupings: [],
    testingDatasets: [],
    trainingDatasets,
    validationDatasets,
    variables: [{ code: 'subjectageyears' }],
  },
  regression21: {
    coVariables: [{ code: 'alzheimerbroadcategory' }],
    filters: '',
    groupings: [],
    testingDatasets: [],
    trainingDatasets,
    validationDatasets,
    variables: [{ code: 'lefthippocampus' }],
  },
};

const kfold = {
  code: 'kfold',
  name: 'validation',
  parameters: [
    {
      code: 'k',
      value: '2',
    },
  ],
};

export interface IMethod {
  code: string;
  parameters: Array<any>;
}

export interface IExperiment {
  model: IModel;
  name: string;
  status: string;
  methods: IMethod[];
  validations: Array<any>;
  uuid?: string;
}

export const experiments = [
  {
    model: models.regression20,
    name: 'histograms',
    status: 'ok',

    methods: [
      {
        code: 'histograms',
        parameters: [],
      },
    ],
    validations: [],
  },
  {
    methods: [
      {
        code: 'linearRegression',
        parameters: [],
      },
    ],
    model: models.regression20,
    name: 'linearRegression',
    status: 'ok',
    validations: [],
  },
  {
    methods: [
      {
        code: 'sgdLinearModel',

        parameters: [
          {
            code: 'alpha',
            value: '0.0001',
          },
          {
            code: 'penalty',
            value: 'l2',
          },
          {
            code: 'l1_ratio',
            value: '0.15',
          },
        ],
      },
    ],
    model: models.regression20,
    name: 'sgdLinearModel',
    status: 'ok',
    validations: [kfold],
  },
  {
    methods: [
      {
        code: 'naiveBayes',

        parameters: [
          {
            code: 'alpha',
            value: '1',
          },
          {
            code: 'class_prior',
            value: '',
          },
        ],
      },
    ],
    model: models.classification20,
    name: 'naiveBayes',
    status: 'ok',
    validations: [kfold],
  },
  {
    methods: [
      {
        code: 'sgdNeuralNetwork',

        parameters: [
          {
            code: 'hidden_layer_sizes',
            value: '100',
          },
          {
            code: 'activation',
            value: 'relu',
          },
          {
            code: 'alpha',
            value: '0.0001',
          },
          {
            code: 'learning_rate_init',
            value: '0.001',
          },
        ],
      },
    ],
    model: models.classification20,
    name: 'sgdNeuralNetwork',
    status: 'ok',
    validations: [kfold],
  },
  {
    methods: [
      {
        code: 'gradientBoosting',

        parameters: [
          {
            code: 'learning_rate',
            value: '0.1',
          },
          {
            code: 'n_estimators',
            value: '100',
          },
          {
            code: 'max_depth',
            value: '3',
          },
          {
            code: 'min_samples_split',
            value: '2',
          },
          {
            code: 'min_samples_leaf',
            value: '1',
          },
          {
            code: 'min_weight_fraction_leaf',
            value: '0',
          },
          {
            code: 'min_impurity_decrease',
            value: '0',
          },
        ],
      },
    ],
    model: models.classification20,
    name: 'gradientBoosting',
    status: 'ok',
    validations: [kfold],
  },
  {
    methods: [
      {
        code: 'anova',
        parameters: [],
      },
    ],
    model: models.regression21,
    name: 'anova',
    status: 'ok',
    validations: [],
  },
  {
    methods: [
      {
        code: 'knn',
        parameters: [
          {
            code: 'k',
            value: '5',
          },
        ],
      },
    ],
    model: models.classification20,
    name: 'knn',
    status: 'ok',
    validations: [kfold],
  },
  {
    methods: [
      {
        code: 'correlationHeatmap', // no displayable result, what variables should be used?
        parameters: [],
      },
    ],
    model: models.regression20,
    name: 'correlationHeatmap',
    status: 'ko',
    validations: [],
  },
  {
    methods: [
      {
        code: 'pca',
        parameters: [],
      },
    ],
    model: models.regression20,
    name: 'pca',
    status: 'ok',

    validations: [],
  },
  {
    methods: [
      {
        code: 'hedwig', // Job dcb21fac-6766-43af-87c2-b8921c5734ef using hbpmip/python-jsi-hedwig:1.0.7 has completed in Chronos, but encountered timeout while waiting for job results. Does the algorithm store its results or errors in the output database?
        parameters: [
          {
            code: 'beam',
            value: '10',
          },
          {
            code: 'support',
            value: '0.1',
          },
        ],
      },
    ],
    model: models.classification21,
    name: 'hedwig',
    status: 'ko',
    validations: [],
  },
  {
    methods: [
      {
        code: 'hinmine',
        parameters: [
          {
            code: 'normalize',
            value: 'true',
          },
          {
            code: '0.85',
            value: '0.85',
          },
        ],
      },
    ],
    model: models.classification20,
    name: 'hinmine',
    status: 'ko',
    validations: [],
  },
  {
    methods: [
      {
        code: 'tSNE',
        parameters: [],
      },
      {
        code: 'linearRegression',
        parameters: [],
      },
    ],
    model: models.regression20,
    name: 'tSNE-linearRegression',
    status: 'ok',
    validations: [],
  },
  {
    methods: [
      {
        code: 'ggparci',
        parameters: [],
      },
    ],
    model: models.classification20,
    name: 'ggparci',
    status: 'ko', // Error in if (min(data_to_plot$value) >= 0 & max(data_to_plot$value) <= : missing value where TRUE/FALSE needed
    validations: [],
  },
  {
    methods: [
      {
        code: 'kmeans',
        parameters: [],
      },
    ],
    model: models.regression20,
    name: 'kmeans',
    status: 'ok',
    validations: [],
  },
  {
    methods: [
      {
        code: 'heatmaply',
        parameters: [],
      },
    ],
    model: models.regression20,
    name: 'heatmaply',
    status: 'ko', // Error in hclustfun_col(dist_x): must have n >= 2 objects to cluster
    validations: [],
  },

  // { code: "WP_VARIABLES_HISTOGRAM" },
  // { code: "PIPELINE_ISOUP_REGRESSION_TREE_SERIALIZER" },
  // { code: "PIPELINE_ISOUP_MODEL_TREE_SERIALIZER" },
  // { code: "WP_LINEAR_REGRESSION" },
  // { code: "K_MEANS" }
];
