# i3-status-travis

Monitor travis-ci builds in your i3-status bar.

[![npm version](https://img.shields.io/npm/v/i3-status-travis.svg?style=flat-square)](https://www.npmjs.com/package/i3-status-travis) 
[![Node.js CI](https://github.com/fehmer/i3-status-travis/actions/workflows/node.js.yml/badge.svg)](https://github.com/fehmer/i3-status-travis/actions/workflows/node.js.yml)

This module for [i3-status](https://www.npmjs.com/package/i3-status) displays the build status from [Travis CI](https://travis-ci.org) projects. Projects without builds or pending or running builds will be ignored.

If you use private builds with Travis Pro or Travis Enterprise you need to provide the config values for *url* and  *token*. This feature is currently untested. If it works please send me a note, thanks.


## Table of content
<!-- MarkdownTOC autolink="true" -->

- [Installation](#installation)
- [Example configurations](#example-configurations)
  - [Showing builds for a single user](#showing-builds-for-a-single-user)
  - [Show build status for multiple users](#show-build-status-for-multiple-users)
  - [Show only selected projects](#show-only-selected-projects)
- [Configuration values](#configuration-values)
  - [url](#url)
  - [projectUrl](#projecturl)
  - [token](#token)
  - [user](#user)
  - [project](#project)
- [Modify the output](#modify-the-output)
- [Modify the reporter](#modify-the-reporter)

<!-- /MarkdownTOC -->


## Installation

``` sh
cd ~/my-i3-status   # go to the directory you installed i3-status in
npm install --save i3-status-travis
```


## Example configurations

You need to provide at least one user to fetch to builds for. The user is the part of the travis ci url, e.g. ```user=fehmer``` will monitor all builds available at [https://travis-ci.org/fehmer/](https://travis-ci.org/fehmer/)

### Showing builds for a single user

This config will show the status of recent builds for one user.

``` yaml
  - name: travis
    module: i3-status-travis
    interval: 300 # refresh each 5 minutes
    label: travis
    user: fehmer
```


### Show build status for multiple users

This config will show the status of recent builds for multiple users combined.


``` yaml
  - name: travis
    module: i3-status-travis
    interval: 300 # refresh each 5 minutes
    label: travis
    user: 
     - fehmer
     - nodejs
```



### Show only selected projects

This config will show the status of the defined projects recent builds for one user. The project value format is ```<user>/<project>```


``` yaml
  - name: travis
    module: i3-status-travis
    interval: 300 # refresh each 5 minutes
    label: travis
    user: fehmer
    project: fehmer/i3-status-travis
```


## Configuration values

Common configuration values like label and interval are described in the [i3-status documentation](https://github.com/fehmer/i3-status/blob/master/docs/configuration.md)


### url

Provide the URL of the [Travis CI API](https://docs.travis-ci.com/api#overview). For public accessible projects you do not need to provide an url and ```https://api.travis-ci.org``` is used.  If you use Travis Enterprise you have to provide the url of your travis server, e.g. ```https://travis.example.com/api```.


``` yaml
  url: https://api.travis-ci.org
```

The url should not end with a slash.

### projectUrl

Provide the URL of the [Travis CI Server](https://travis-ci.org/). For public accessible projects you do not need to provide an url and ```https://travis-ci.org``` is used.  If you use Travis Enterprise you have to provide the url of your travis server, e.g. ```https://travis.example.com```.

The project url should not end with a slash.

``` yaml
  url: https://travis-ci.org
```

### token

If a token is required for the travis ci server you use you can provide it like this:

``` yaml
  token: mySecretToken
```

The token allows access to your projects on travis-ci. You should encrypt the value to make more secure. The [i3-status documentation](https://github.com/fehmer/i3-status#a-note-on-security) tells you how to do this.

When you use the public travis ci server you need to provide the token if you get ```Error: Got response code 403``` from the module. 

To obtain a travis ci token you need a github account and a github personal access token. Follow theese steps to create a github personal access token.

- Login into github
- go to Settings -> Personal access tokens
- Click create new token
- Use ```i3-status-travis``` as the token description
- check this settings
  + repo:status
  + repo:deployment
  + read:org
  + write:repo-hook
  + user:email
- click generate token
- save the generated personal access token somewhere

To generate the travis ci secret token execute this shell command with your GITHUB_PERSONAL_ACCESS_TOKEN from the step above:

```sh
curl https://api.travis-ci.org/auth/github -X POST  -d '{"github_token":"GITHUB_PERSONAL_ACCESS_TOKEN"}'  -H "Accept: application/vnd.travis-ci.2+json" -H "User-Agent: MyClient/1.0.0" -H "Content-Type: application/json"
```

The command should return your travis ci access token like this:

``` json
{"access_token":"MySecretToken"}
```


### user

You can configure a single or multiple users. All available build states for each user is gathered from travis ci and combined for the output.

For a single user just set the value like this:

``` yaml
  user: fehmer
```


For multiple users you can provide a list like this:


``` yaml
  user:
    - fehmer
    - nodejs
```


### project

If you only want to monitor selected projects you can provide a single project name or multiple project names. A project name contains of the user and the project name, e.g. ```fehmer/i3-status-travis```.

For a single project just set the project name like this:

``` yaml
  user: fehmer
  project: fehmer/i3-status-travis
```


For multiple projects you can provide a list like this:

``` yaml
  user:
    - fehmer
    - nodejs
  project:
    - fehmer/i3-status-travis
    - nodejs/nodejs.org
```


## Modify the output 

When you activate the *colorize* option a successful build state is shown in green and a failed build state in red. 

``` yaml
    colorize: true
```


You can define the texts and colors for successful and failed builds.
The default text is **** for successful and **** for failed builds.

``` yaml
    success:
      color: '#AAFFAA'
      text: all systems are go
    failure:
      color: '#FFAAAA'
      text: hudson, we have a problem
```

## Modify the reporter

If you click on the status a popup will appear (if you added the [i3-status-reporter-html](https://github.com/fehmer/i3-status-reporter-html)), see [i3-status documentation](https://github.com/fehmer/i3-status#reporters).

You can modify the output of the reporter. The following example will show all build projects ordered by the projects name.

``` yaml
    report:
      dots: true        # display circles in front of the projects name, default = true
      showSuccess: true # show failed and successfull builds, default = false, only failed builds are shown
      sortByName: true  # sort the projects by name, default = false
```

