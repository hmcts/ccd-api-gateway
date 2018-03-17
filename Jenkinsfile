#!groovy

properties(
    [[$class: 'GithubProjectProperty', projectUrlStr: 'https://git.reform.hmcts.net/case-management/ccd-api-gateway-web/'],
     pipelineTriggers([[$class: 'GitHubPushTrigger']])]
)

@Library('Reform')
import uk.gov.hmcts.Ansible
import uk.gov.hmcts.Packager
import uk.gov.hmcts.RPMTagger

ansible = new Ansible(this, 'ccdata')
packager = new Packager(this, 'ccdata')

milestone()
lock(resource: "ccd-api-gateway-web-${env.BRANCH_NAME}", inversePrecedence: true) {
    node {
        try {
            wrap([$class: 'AnsiColorBuildWrapper', colorMapName: 'xterm']) {
                stage('Checkout') {
                    deleteDir()
                    checkout scm
                }

                stage('Setup (install only)') {
                    sh "yarn install"
                }

                stage('Node security check') {
                    sh "yarn test:nsp"
                }

                stage('Test') {
                    sh "yarn test"
                    sh "yarn run integration"
                }

                def rpmVersion

                stage('Package application (RPM)') {
                    rpmVersion = packager.nodeRPM('ccd-api-gateway-web')
                }

                stage('Publish RPM') {
                    packager.publishNodeRPM('ccd-api-gateway-web')
                }

                def rpmTagger = new RPMTagger(
                    this,
                    'ccd-api-gateway-web',
                    packager.rpmName('ccd-api-gateway-web', rpmVersion),
                    'ccdata-local'
                )

                publishAndDeploy(rpmTagger, rpmVersion, 'develop', 'dev')
                publishAndDeploy(rpmTagger, rpmVersion, 'master', 'test')

                milestone()
            }
        } catch (err) {
            notifyBuildFailure channel: '#ccd-notifications'
            throw err
        }
    }
}

def publishAndDeploy(rpmTagger, rpmVersion, branch, env) {
    def version
    def apiGatewayVersion

    // stage('Package (Docker)') {
    //     apiGatewayVersion = dockerImage imageName: 'ccd/ccd-api-gateway', tags: [branch]
    // }

    stage('Deploy: ' + env) {
        version = "{ccd_api_gateway_web_version: ${rpmVersion}}"
        ansible.runDeployPlaybook(version, env, branch)
        rpmTagger.tagDeploymentSuccessfulOn(env)
    }

    stage('Smoke Tests: ' + env) {
        sh "curl -vf https://case-api-gateway-web." + env + ".ccd.reform.hmcts.net/health"
        rpmTagger.tagTestingPassedOn(env)
    }
}
