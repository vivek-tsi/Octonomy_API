export default class ENV {
  public static get BASE_URL() {
    return process.env.BASE_URL;
  }

  public static get TOKEN() {
    return process.env.SERVICE_ACCOUNT_TOKEN || process.env.TOKEN;
  }

  public static get SERVICE_ACCOUNT_TOKEN() {
    return process.env.SERVICE_ACCOUNT_TOKEN || process.env.TOKEN;
  }

  public static get QALITY_BASE_URL() {
    return process.env.QALITY_BASE_URL || 'https://apps-qalityplus.soldevelo.com/api';
  }

  public static get QALITY_API_TOKEN() {
    return process.env.QALITY_API_TOKEN;
  }

  public static get QALITY_TEST_CYCLE_ID() {
    return process.env.QALITY_TEST_CYCLE_ID;
  }
}
