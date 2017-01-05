# i3-status-travis

Monitor travis-ci builds in your i3-status bar.

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/59f026abe8ce42c28426e3728db24cf2)](https://www.codacy.com/app/fehmer/i3-status-travis?utm_source=github.com&utm_medium=referral&utm_content=fehmer/i3-status-travis&utm_campaign=badger)
[![npm version](https://badge.fury.io/js/i3-status-travis.svg)](https://badge.fury.io/js/i3-status-travis)
[![Dependency Status](https://gemnasium.com/badges/github.com/fehmer/i3-status-travis.svg)](https://gemnasium.com/github.com/fehmer/i3-status-travis)
[![Build Status](https://travis-ci.org/fehmer/i3-status-travis.svg?branch=master)](https://travis-ci.org/fehmer/i3-status-travis)

This module for [i3-status](https://www.npmjs.com/package/i3-status) displays the build status from [Travis CI](https://travis-ci.org) projects. Projects without builds or pending or running builds will be ignored.

If you use private builds with Travis Pro or Travis Enterprise you need to provide the config values for *url* and  *token*. This feature is currently untested. If it works please send me a note, thanks.


## Table of content
<!-- MarkdownTOC -->

- [Installation](#installation)
- [Example configurations](#example-configurations)
  - [Showing builds for a single user](#showing-builds-for-a-single-user)
  - [Show build status for multiple users](#show-build-status-for-multiple-users)
  - [Show only selected projects](#show-only-selected-projects)
- [Configuration values](#configuration-values)
  - [url](#url)
  - [token](#token)
  - [user](#user)
  - [project](#project)
- [Modify the output](#modify-the-output)

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

Provide the URL the [Travis CI API](https://docs.travis-ci.com/api#overview). For public accessible projects you do not need to provide an url and ```https://api.travis-ci.org``` is used.  If you use Travis Enterprise you have to provide the url of your travis server, e.g. ```https://travis.example.com/api```.

The url should not end with a slash.


### token

If you use Travis Pro or Travis Enterprise you have to set this value. The [Travis API Documentation](https://docs.travis-ci.com/api#authentication) tells you what value to provide here.


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