###### [SMK](..)

# Installing SMK

There are a variety of ways to install SMK into your application.


## Use `smk create`

If you want to create a new application using SMK, then the easiest way is with the `smk-cli`.
First make sure that the `smk-cli` is installed globally in your machine:

    > npm install --global @bcgov/smk-cli

Test that this worked:

    > smk help

You should see the help information for `smk-cli`.

Change to the a directory where you keep your projects, and create a new SMK application (change `my-new-app` to whatever you like).

    > cd projects
    > smk create my-new-app

You will be asked some questions about your new application.
Once they are answered you will have a new skeleton application at `projects/my-new-app`.


## Install from NPM

In your NPM project, use this command to add SMK as a dependency:

    > npm install @bcgov/smk

Then, in your application you add the SMK library like this:

    <script src="node_modules/@bcgov/smk/dist/smk.js"></script>


## Download

Click one of the download links to left to download the most recent build of SMK.
After unzipping the package, you should copy the `dist` folder to your project.

Then in your application, you could include SMK like this (assumeing you copied `dist` to `assets/js/smk`):

    <script src="assets/js/smk/smk.js"></script>


## Use deployed version

Include this in your application:

    <script src="[url of smk deployment]/smk.js"></script>


